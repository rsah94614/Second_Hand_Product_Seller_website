const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Order = require('../../../models/Order');
const Report = require('../../../models/Report');
const BlockedUser = require('../../../models/BlockedUser');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const { buildWishlistPayload } = require('./user.service');
const { createNotification } = require('../../shared/utils/notification.utils');
const { computeProfileScore, canTradeOnCampus } = require('../../shared/utils/profileCompletion.utils');
const { calculateReputation, getReputationHistory, checkVerificationEligibility } = require('../../services/reputation.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const recalculateSellerReviewStats = (user) => {
  const reviewCount = user.reviews?.length || 0;
  const averageRating = reviewCount
    ? Number((user.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
    : 0;
  user.reviewCount = reviewCount;
  user.averageRating = averageRating;
};

/**
 * Build honest trust labels for a user.
 */
const buildTrustLabels = (user, { completedOrders = 0, openReports = 0 } = {}) => {
  const labels = [];
  const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const score = computeProfileScore(user);

  if (score >= 80) labels.push({ key: 'profile_complete', label: 'Profile Complete', color: 'blue' });
  if (ageDays < 7) labels.push({ key: 'new_member', label: 'New Member', color: 'gray' });
  if (completedOrders >= 3 && user.averageRating >= 4.0 && openReports === 0) {
    labels.push({ key: 'trusted_seller', label: 'Trusted Seller', color: 'emerald' });
  }
  if (completedOrders >= 10 && user.averageRating >= 4.5) {
    labels.push({ key: 'top_rated', label: 'Top Rated', color: 'amber' });
  }
  if (user.role === 'admin') labels.push({ key: 'staff_verified', label: 'Staff Verified', color: 'purple' });

  return labels;
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'wishlist', populate: { path: 'seller', select: 'name location' } })
      .select('wishlist');
    return res.json({ products: user?.wishlist || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'recentlyViewed.product',
        match: { isActive: true, isSold: false },
        populate: { path: 'seller', select: 'name location' },
      })
      .select('recentlyViewed');

    const products = (user?.recentlyViewed || [])
      .filter((entry) => entry.product)
      .map((entry) => ({ ...entry.product.toObject(), viewedAt: entry.viewedAt }));

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select('_id isActive isSold');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const user = await User.findById(req.user._id).select('wishlist');
    const productId = product._id.toString();
    const currentWishlist = (user.wishlist || []).map((item) => item.toString());
    const exists = currentWishlist.includes(productId);

    user.wishlist = exists
      ? user.wishlist.filter((item) => item.toString() !== productId)
      : [...user.wishlist, product._id];

    await user.save();
    return res.json({
      message: exists ? 'Removed from wishlist' : 'Added to wishlist',
      added: !exists,
      ...buildWishlistPayload(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Profile ──────────────────────────────────────────────────────────────────

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('reviews.user', 'name')
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires -blocked -riskFlags');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Parallel data fetches for trust signals
    const [recentProducts, completedOrderCount, openReportCount, cancelledOrderCount] = await Promise.all([
      Product.find({ seller: req.params.id, isActive: true }).sort({ createdAt: -1 }).limit(10),
      Order.countDocuments({ seller: req.params.id, status: 'completed' }),
      Report.countDocuments({ reportedUser: req.params.id, status: { $in: ['open', 'reviewed'] } }),
      Order.countDocuments({ seller: req.params.id, status: 'cancelled' }),
    ]);

    const { score: profileCompletionScore, missing, canTrade } = canTradeOnCampus(user);
    const trustLabels = buildTrustLabels(user, { completedOrders: completedOrderCount, openReports: openReportCount });

    const ageDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalOrders = completedOrderCount + cancelledOrderCount;
    const cancellationRate = totalOrders > 0
      ? Math.round((cancelledOrderCount / totalOrders) * 100)
      : 0;

    return res.json({
      user,
      recentProducts,
      trustSignals: {
        profileCompletionScore,
        trustLabels,
        accountAgeDays: ageDays,
        completedOrders: completedOrderCount,
        cancellationRate,
        reportCount: openReportCount,
        reviewCount: user.reviewCount,
        averageRating: user.averageRating,
        isNewSeller: ageDays < 7,
        missing,
        canTrade,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const allowedUpdates = {};
    const fields = ['name', 'email', 'location', 'avatar', 'profileRole'];
    fields.forEach((f) => { if (req.body[f] !== undefined) allowedUpdates[f] = req.body[f]; });


    if (req.body.campus) {
      const c = req.body.campus;
      const campusFields = ['department', 'course', 'year', 'semester', 'hostel', 'residentType'];
      campusFields.forEach((f) => {
        if (c[f] !== undefined) allowedUpdates[`campus.${f}`] = c[f];
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires');

    return res.json(updatedUser);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    return res.status(500).json({ message: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  const tempPath = req.file?.path;
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Avatar image is required' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'campusmitra-avatars',
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: result.secure_url },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires');

    return res.json({ message: 'Avatar updated', avatar: result.secure_url, user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    }
  }
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

const addSellerReview = async (req, res) => {
  try {
    const { rating, comment = '', orderId } = req.body;
    const numericRating = Number(rating);
    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    if (seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot review your own seller profile' });
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // ── Review gate: must have a completed order with this seller ──────────
    if (!orderId) {
      return res.status(400).json({
        message: 'You can only review a seller after completing a deal with them.',
        code: 'REVIEW_ORDER_REQUIRED',
      });
    }

    const order = await Order.findById(orderId).populate('items.product', 'seller');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review orders you placed' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({
        message: 'Reviews are only allowed after a deal is completed.',
        code: 'ORDER_NOT_COMPLETED',
      });
    }

    // Verify the order is actually for this seller
    const orderSeller = order.seller?.toString();
    if (orderSeller && orderSeller !== req.params.id) {
      return res.status(400).json({ message: 'This order is not associated with this seller.' });
    }

    const existingReview = seller.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment.trim();
      existingReview.orderId = orderId;
      existingReview.isVerifiedPurchase = true;
    } else {
      seller.reviews.push({
        user: req.user._id,
        rating: numericRating,
        comment: comment.trim(),
        orderId,
        isVerifiedPurchase: true,
      });
    }

    recalculateSellerReviewStats(seller);
    await seller.save();
    await seller.populate('reviews.user', 'name');

    await createNotification({
      userId: seller._id,
      actorId: req.user._id,
      type: existingReview ? 'review_updated' : 'new_review',
      title: existingReview ? 'A seller review was updated' : 'New seller review received',
      message: `${req.user.name} rated you ${numericRating}/5${comment.trim() ? ' and left feedback.' : '.'}`,
      link: '/profile',
      metadata: { rating: numericRating, reviewCount: seller.reviewCount },
    });

    return res.json({
      message: existingReview ? 'Review updated' : 'Review added',
      reviews: seller.reviews,
      averageRating: seller.averageRating,
      reviewCount: seller.reviewCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Block / Unblock ──────────────────────────────────────────────────────────

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const target = await User.findById(userId).select('_id name');
    if (!target) return res.status(404).json({ message: 'User not found' });

    const existing = await BlockedUser.findOne({ blocker: req.user._id, blocked: userId });
    if (existing) {
      return res.status(400).json({ message: 'You have already blocked this user' });
    }

    await BlockedUser.create({ blocker: req.user._id, blocked: userId });

    return res.json({ message: `${target.name} has been blocked. They can no longer send you messages.` });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already blocked this user' });
    }
    return res.status(500).json({ message: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await BlockedUser.findOneAndDelete({ blocker: req.user._id, blocked: userId });
    if (!deleted) return res.status(404).json({ message: 'Block record not found' });
    return res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await BlockedUser.find({ blocker: req.user._id })
      .populate('blocked', 'name avatar')
      .sort({ createdAt: -1 });

    return res.json({ blocked: blocks.map((b) => b.blocked) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Profile Completion ───────────────────────────────────────────────────────

const getProfileCompletion = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('name avatar campus profileRole location emailVerified');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const { score, missing, isComplete, canTrade } = canTradeOnCampus(user);
    return res.json({ score, missing, isComplete, canTrade });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Seller Verification (Task 2.7.1) ────────────────────────────────────────

const requestSellerVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if already verified
    if (user.sellerVerified) {
      return res.status(400).json({ message: 'You are already verified as a seller' });
    }

    // Check if already pending
    if (user.sellerVerificationStatus === 'pending') {
      return res.status(400).json({ message: 'Your verification request is already pending' });
    }

    // Check eligibility
    const reputation = await calculateReputation(user._id);
    const eligibility = checkVerificationEligibility(user, reputation);

    if (!eligibility.eligible) {
      return res.status(400).json({
        message: eligibility.message,
        criteria: eligibility.criteria,
        reputation,
      });
    }

    // Update user
    user.sellerVerificationStatus = 'pending';
    user.sellerVerificationRequestedAt = new Date();
    await user.save();

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    if (admins.length > 0) {
      const { createNotifications } = require('../../shared/utils/notification.utils');
      await createNotifications(admins.map(a => a._id), {
        actorId: user._id,
        type: 'seller_verification_request',
        title: 'New seller verification request',
        message: `${user.name} requested seller verification`,
        link: '/admin/seller-verifications',
        metadata: { userId: user._id, reputation },
      });
    }

    return res.json({
      message: 'Seller verification requested successfully',
      status: user.sellerVerificationStatus,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSellerVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('sellerVerified sellerVerificationStatus sellerVerificationDate sellerVerificationReason sellerVerificationRequestedAt');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get reputation and eligibility
    const reputation = await calculateReputation(user._id);
    const eligibility = checkVerificationEligibility(user, reputation);

    return res.json({
      sellerVerified: user.sellerVerified,
      status: user.sellerVerificationStatus,
      verificationDate: user.sellerVerificationDate,
      reason: user.sellerVerificationReason,
      requestedAt: user.sellerVerificationRequestedAt,
      eligibility,
      reputation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Reputation System (Task 2.7.2) ──────────────────────────────────────────

const getUserReputation = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const reputation = await calculateReputation(userId);

    return res.json({ reputation });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserReputationHistory = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;
    const days = parseInt(req.query.days) || 30;

    const history = await getReputationHistory(userId, days);

    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWishlist,
  getRecentlyViewed,
  toggleWishlist,
  getUserProfile,
  addSellerReview,
  uploadAvatar,
  updateUserProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getProfileCompletion,
  requestSellerVerification,
  getSellerVerificationStatus,
  getUserReputation,
  getUserReputationHistory,
};
