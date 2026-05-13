const User = require('../../../../models/User');
const Product = require('../../../../models/Product');
const Order = require('../../../../models/Order');
const Report = require('../../../../models/Report');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const { buildTrustLabels } = require('../user.service');
const { canTradeOnCampus } = require('../../../shared/utils/profileCompletion.utils');

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('reviews.user', 'name')
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpires -blocked -riskFlags');

    if (!user) return res.status(404).json({ message: 'User not found' });

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

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  getProfileCompletion,
};
