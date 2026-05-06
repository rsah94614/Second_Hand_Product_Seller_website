const User = require('../../../../models/User');
const Order = require('../../../../models/Order');
const { recalculateSellerReviewStats } = require('../user.service');
const { createNotification } = require('../../../shared/utils/notification.utils');
const { calculateReputation, getReputationHistory, checkVerificationEligibility } = require('../../../services/reputation.service');

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

const requestSellerVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.sellerVerified) {
      return res.status(400).json({ message: 'You are already verified as a seller' });
    }

    if (user.sellerVerificationStatus === 'pending') {
      return res.status(400).json({ message: 'Your verification request is already pending' });
    }

    const reputation = await calculateReputation(user._id);
    const eligibility = checkVerificationEligibility(user, reputation);

    if (!eligibility.eligible) {
      return res.status(400).json({
        message: eligibility.message,
        criteria: eligibility.criteria,
        reputation,
      });
    }

    user.sellerVerificationStatus = 'pending';
    user.sellerVerificationRequestedAt = new Date();
    await user.save();

    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    if (admins.length > 0) {
      const { createNotifications } = require('../../../shared/utils/notification.utils');
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
  addSellerReview,
  requestSellerVerification,
  getSellerVerificationStatus,
  getUserReputation,
  getUserReputationHistory,
};
