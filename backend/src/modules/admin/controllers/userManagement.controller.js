const User = require('../../../../models/User');
const Report = require('../../../../models/Report');
const AdminActivity = require('../../../../models/AdminActivity');
const { logAuditAction } = require('../../../shared/utils/audit.utils');
const { computeUserRiskScore = () => 0 } = require('../../../shared/utils/riskDetection.utils');
const { createNotification } = require('../../../shared/utils/notification.utils');
const mongoose = require('mongoose');

const escapeRegex = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const getUsers = async (req, res) => {
  try {
    const { cursor, limit = 50, role, search, status } = req.query;
    const query = {};

    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      query._id = { $lt: cursor };
    }

    if (role) query.role = role;

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { location: { $regex: searchRegex } },
      ];
    }

    const numericLimit = Number(limit);

    const users = await User.find(query)
      .select('-password -refreshTokens')
      .sort({ _id: -1 })
      .limit(numericLimit);

    const total = await User.countDocuments(query);
    const nextCursor = users.length === numericLimit ? users[users.length - 1]._id.toString() : null;

    return res.json({ users, nextCursor, total });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const allowedUpdates = {};
    if (req.body.role && ['user', 'admin'].includes(req.body.role)) {
      allowedUpdates.role = req.body.role;
    }
    if (req.body.isActive !== undefined) {
      allowedUpdates.isActive = Boolean(req.body.isActive);
    }
    if (req.body.isVerified !== undefined) {
      allowedUpdates.isVerified = Boolean(req.body.isVerified);
    }

    const targetUser = await User.findById(req.params.id).select('-password');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser._id.toString() === req.user._id.toString()) {
      if (allowedUpdates.isActive === false) return res.status(400).json({ message: 'You cannot deactivate your own admin account' });
      if (allowedUpdates.role && allowedUpdates.role !== 'admin') return res.status(400).json({ message: 'You cannot remove your own admin access' });
    }

    Object.assign(targetUser, allowedUpdates);
    await targetUser.save();

    await logAuditAction({
      action: 'USER_UPDATED',
      actor: req.user._id,
      targetType: 'User',
      targetId: targetUser._id,
      details: allowedUpdates,
      req,
    });

    return res.json({ message: 'User updated successfully', user: targetUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const suspendUser = async (req, res) => {
  try {
    const suspended = req.body.suspended !== undefined ? Boolean(req.body.suspended) : true;
    const reason = req.body.reason ?? req.body.suspensionReason ?? '';
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser._id.toString() === req.user._id.toString()) return res.status(400).json({ message: 'You cannot suspend yourself' });
    if (targetUser.role === 'admin') return res.status(400).json({ message: 'You cannot suspend an admin account' });

    targetUser.isSuspended = suspended;
    targetUser.suspendedReason = suspended ? reason.trim() : '';
    if (suspended) targetUser.suspendedAt = new Date();
    await targetUser.save();

    await logAuditAction({
      action: suspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      actor: req.user._id,
      targetType: 'User',
      targetId: targetUser._id,
      details: { reason },
      req,
    });

    return res.json({ message: `User ${suspended ? 'suspended' : 'unsuspended'} successfully`, user: targetUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSuspiciousUsers = async (req, res) => {
  try {
    const suspicious = await User.find({
      $or: [
        { isSuspended: true },
        { 'riskFlags.0': { $exists: true } }
      ]
    }).select('-password -refreshTokens').lean();

    const reportCounts = await Report.aggregate([
      { $match: { targetType: { $in: ['user', 'chat'] }, status: { $in: ['open', 'reviewed'] } } },
      { $group: { _id: '$reportedUser', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } }
    ]);

    const reportedUserIds = reportCounts.map(u => u._id);
    const reportedUsers = await User.find({ _id: { $in: reportedUserIds } }).select('-password -refreshTokens').lean();

    const combinedMap = new Map();
    suspicious.forEach(u => combinedMap.set(u._id.toString(), u));
    reportedUsers.forEach(u => {
      if (!combinedMap.has(u._id.toString())) combinedMap.set(u._id.toString(), u);
    });

    const result = Array.from(combinedMap.values()).map((user) => {
      const reports = reportCounts.find(r => r._id.toString() === user._id.toString())?.count || 0;
      return { ...user, currentRiskScore: computeUserRiskScore(user, { openReportCount: reports }) };
    }).sort((a, b) => b.currentRiskScore - a.currentRiskScore);

    return res.json({ users: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSellerVerifications = async (req, res) => {
  try {
    const { status, cursor, limit = 50 } = req.query;
    const query = {};
    if (cursor && isValidObjectId(cursor)) query._id = { $lt: cursor };

    if (status && ['pending', 'verified', 'rejected', 'all'].includes(status)) {
      if (status !== 'all') query.sellerVerificationStatus = status;
    } else {
      query.sellerVerificationStatus = 'pending';
    }

    const numericLimit = Number(limit);
    const users = await User.find(query)
      .select('name email sellerVerificationStatus sellerVerificationRequestedAt sellerVerificationDate sellerVerificationReason averageRating reviewCount')
      .sort({ _id: -1 })
      .limit(numericLimit);

    const nextCursor = users.length === numericLimit ? users[users.length - 1]._id.toString() : null;
    return res.json({ users, nextCursor });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const approveSellerVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.sellerVerificationStatus !== 'pending') return res.status(400).json({ message: 'No pending verification request' });

    user.sellerVerified = true;
    user.sellerVerificationStatus = 'verified';
    user.sellerVerificationDate = new Date();
    await user.save();

    await createNotification({
      userId: user._id,
      actorId: req.user._id,
      type: 'seller_verification_approved',
      title: 'Seller verification approved',
      message: 'Congratulations! Your seller verification has been approved.',
      link: '/profile',
    });

    await logAuditAction({
      action: 'SELLER_VERIFICATION_APPROVED',
      actor: req.user._id,
      targetType: 'User',
      targetId: user._id,
      details: { userName: user.name },
      req,
    });

    return res.json({ message: 'Seller verification approved', user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const rejectSellerVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ message: 'Rejection reason is required' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.sellerVerificationStatus !== 'pending') return res.status(400).json({ message: 'No pending verification request' });

    user.sellerVerified = false;
    user.sellerVerificationStatus = 'rejected';
    user.sellerVerificationDate = new Date();
    user.sellerVerificationReason = reason.trim();
    await user.save();

    await createNotification({
      userId: user._id,
      actorId: req.user._id,
      type: 'seller_verification_rejected',
      title: 'Seller verification rejected',
      message: `Your seller verification was rejected. Reason: ${reason.trim()}`,
      link: '/profile',
    });

    await logAuditAction({
      action: 'SELLER_VERIFICATION_REJECTED',
      actor: req.user._id,
      targetType: 'User',
      targetId: user._id,
      details: { userName: user.name, reason: reason.trim() },
      req,
    });

    return res.json({ message: 'Seller verification rejected', user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkSuspendUsers = async (req, res) => {
  try {
    const { userIds, suspended = true, reason = '' } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ message: 'userIds array is required' });
    if (userIds.length > 50) return res.status(400).json({ message: 'Maximum 50 users per bulk action' });

    const targets = await User.find({ _id: { $in: userIds, $ne: req.user._id }, role: { $ne: 'admin' } }).select('_id name');
    const safeIds = targets.map((u) => u._id);

    await User.updateMany(
      { _id: { $in: safeIds } },
      { $set: { isSuspended: suspended, suspendedReason: suspended ? reason.trim() : '', ...(suspended ? { suspendedAt: new Date() } : {}) } }
    );

    await AdminActivity.create({
      admin: req.user._id,
      action: suspended ? 'BULK_SUSPEND_USERS' : 'BULK_UNSUSPEND_USERS',
      targetType: 'Bulk',
      affectedIds: safeIds,
      details: { count: safeIds.length, reason },
      ip: req.ip,
    });

    return res.json({ message: `${safeIds.length} user(s) ${suspended ? 'suspended' : 'unsuspended'} successfully`, affectedCount: safeIds.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updateUser,
  suspendUser,
  getSuspiciousUsers,
  getSellerVerifications,
  approveSellerVerification,
  rejectSellerVerification,
  bulkSuspendUsers,
};
