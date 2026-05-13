const User = require('../../../../models/User');
const Product = require('../../../../models/Product');
const Order = require('../../../../models/Order');
const Report = require('../../../../models/Report');
const AuditLog = require('../../../../models/AuditLog');
const AdminActivity = require('../../../../models/AdminActivity');
const { ensureDefaultCategories } = require('../../../../utils/categoryDefaults');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const getOverview = async (req, res) => {
  try {
    await ensureDefaultCategories();

    const [
      totalUsers,
      totalMembers,
      totalAdmins,
      totalProducts,
      activeProducts,
      soldProducts,
      inactiveProducts,
      totalOrders,
      requestedOrders,
      completedOrders,
      totalRevenueResult,
      topProducts,
      recentUsers,
      recentOrders,
      openReports,
      categoryBreakdown,
      suspendedUsers,
      flaggedListings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'admin' }),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true, isSold: false }),
      Product.countDocuments({ isSold: true }),
      Product.countDocuments({ isActive: false, isSold: false }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'requested' }),
      Order.countDocuments({ status: 'completed' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Product.find({ isActive: true, isSold: false })
        .select('_id title category isSold isActive views price images location createdAt')
        .sort({ views: -1 })
        .limit(5)
        .lean(),
      User.find()
        .select('_id name email role isActive createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Order.find()
        .select('_id total status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Report.countDocuments({ status: { $in: ['open', 'reviewed'] } }),
      Product.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$category', 'Other'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
        {
          $project: {
            _id: 0,
            category: '$_id',
            count: 1,
          },
        },
      ]),
      User.countDocuments({ isSuspended: true }),
      Product.countDocuments({ flagged: true })
    ]);

    const metrics = {
      totalUsers,
      totalMembers,
      totalAdmins,
      totalProducts,
      activeProducts,
      soldProducts,
      inactiveProducts,
      totalOrders,
      requestedOrders,
      completedOrders,
      openReports,
      suspendedUsers,
      flaggedListings,
      totalRevenue: (totalRevenueResult[0] && totalRevenueResult[0].total) || 0,
    };

    return res.json({
      metrics,
      topProducts,
      recentUsers,
      recentOrders,
      categoryBreakdown,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const { cursor, limit = 20, targetType = '' } = req.query;
    const query = {};

    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      query._id = { $lt: cursor };
    }

    if (targetType) {
      query.targetType = targetType;
    }

    const numericLimit = Number(limit);

    const logs = await AuditLog.find(query)
      .populate('actor', 'name email')
      .sort({ _id: -1 })
      .limit(numericLimit);

    const total = await AuditLog.countDocuments(query);
    const nextCursor = logs.length === numericLimit ? logs[logs.length - 1]._id.toString() : null;

    return res.json({
      logs,
      nextCursor,
      total,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getActivityTimeline = async (req, res) => {
  try {
    const { cursor, limit = 20, adminId, targetType } = req.query;
    const query = {};

    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      query._id = { $lt: cursor };
    }

    if (adminId && isValidObjectId(adminId)) {
      query.admin = adminId;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    const numericLimit = Math.min(Number(limit) || 20, 100);

    const activities = await AdminActivity.find(query)
      .populate('admin', 'name email')
      .sort({ _id: -1 })
      .limit(numericLimit);

    const total = await AdminActivity.countDocuments(query);
    const nextCursor =
      activities.length === numericLimit
        ? activities[activities.length - 1]._id.toString()
        : null;

    return res.json({ activities, nextCursor, total });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOverview,
  getAuditLogs,
  getActivityTimeline,
};
