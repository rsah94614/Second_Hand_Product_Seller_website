const mongoose = require('mongoose');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Order = require('../../../models/Order');
const Category = require('../../../models/Category');
const Report = require('../../../models/Report');
const { ensureDefaultCategories } = require('../../../utils/categoryDefaults');
const {
  createNotification,
  createNotifications,
} = require('../../shared/utils/notification.utils');
const { logAuditAction } = require('../../shared/utils/audit.utils');
const { computeUserRiskScore } = require('../../shared/utils/riskDetection.utils');

const escapeRegex = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    if (role) {
      query.role = role;
    }

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

    return res.json({
      users,
      nextCursor,
      total,
    });
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

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      if (allowedUpdates.isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own admin account' });
      }

      if (allowedUpdates.role && allowedUpdates.role !== 'admin') {
        return res.status(400).json({ message: 'You cannot remove your own admin access' });
      }
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

    return res.json({
      message: 'User updated successfully',
      user: targetUser,
    });
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
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot suspend yourself' });
    }
    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: 'You cannot suspend an admin account' });
    }

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
    // Users who have risk flags, are suspended, or have multiple reports
    const suspicious = await User.find({
      $or: [
        { isSuspended: true },
        { 'riskFlags.0': { $exists: true } }
      ]
    }).select('-password -refreshTokens').lean();

    // Also fetch users with open reports
    const reportCounts = await Report.aggregate([
      { $match: { targetType: { $in: ['user', 'chat'] }, status: { $in: ['open', 'reviewed'] } } },
      { $group: { _id: '$reportedUser', count: { $sum: 1 } } },
      { $match: { count: { $gte: 2 } } }
    ]);

    const reportedUserIds = reportCounts.map(u => u._id);
    const reportedUsers = await User.find({ _id: { $in: reportedUserIds } }).select('-password -refreshTokens').lean();

    // Merge and deduplicate
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

const getProducts = async (req, res) => {
  try {
    const { cursor, limit = 50, category, status, search } = req.query;
    const query = {};

    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      query._id = { $lt: cursor };
    }

    if (category) {
      query.category = category;
    }

    if (status === 'active') {
      query.isActive = true;
      query.isSold = false;
    } else if (status === 'sold') {
      query.isSold = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ];
    }

    const numericLimit = Number(limit);

    const products = await Product.find(query)
      .populate('seller', 'name email')
      .sort({ _id: -1 })
      .limit(numericLimit);
      
    const total = await Product.countDocuments(query);
    const nextCursor = products.length === numericLimit ? products[products.length - 1]._id.toString() : null;

    return res.json({
      products,
      nextCursor,
      total,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSuspiciousProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $or: [
        { flagged: true },
        { riskScore: { $gte: 40 } }
      ]
    }).populate('seller', 'name email').sort({ riskScore: -1 }).limit(100);

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updates = {};

    if (req.body.isActive !== undefined) {
      updates.isActive = Boolean(req.body.isActive);
    }

    if (req.body.isSold !== undefined) {
      updates.isSold = Boolean(req.body.isSold);
    }

    const currentProduct = await Product.findById(req.params.id).select('title isActive isSold seller');

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (currentProduct) {
      const changedStatus = currentProduct.isActive !== product.isActive || currentProduct.isSold !== product.isSold;

      if (changedStatus) {
        let title = 'Listing status updated by admin';
        let message = `Your listing "${product.title}" was updated by admin.`;
        let type = 'listing_admin_update';

        if (product.isSold) {
          title = 'Listing marked sold by admin';
          message = `Your listing "${product.title}" was marked sold by admin.`;
          type = 'listing_marked_sold';
        } else if (product.isActive === false) {
          title = 'Listing deactivated by admin';
          message = `Your listing "${product.title}" was deactivated by admin.`;
          type = 'listing_deactivated';
        } else if (product.isActive && !product.isSold) {
          title = 'Listing reactivated by admin';
          message = `Your listing "${product.title}" is active again.`;
          type = 'listing_reactivated';
        }

        await Promise.all([
          createNotification({
            userId: product.seller._id,
            actorId: req.user._id,
            productId: product._id,
            type,
            title,
            message,
            link: '/my-products',
            metadata: {
              isActive: product.isActive,
              isSold: product.isSold,
            },
          }),
          createNotifications(
            (
              await User.find({ wishlist: product._id }).select('_id')
            )
              .map((user) => user._id)
              .filter((userId) => userId.toString() !== product.seller._id.toString()),
            {
              actorId: req.user._id,
              productId: product._id,
              type: product.isSold ? 'wishlist_item_sold' : product.isActive === false ? 'wishlist_item_unavailable' : 'wishlist_item_available',
              title: product.isSold
                ? 'Saved item was marked sold'
                : product.isActive === false
                  ? 'Saved item became unavailable'
                  : 'Saved item is available again',
              message: product.isSold
                ? `"${product.title}" is no longer available because it was marked sold.`
                : product.isActive === false
                  ? `"${product.title}" is currently unavailable.`
                  : `"${product.title}" is active again.`,
              link: product.isSold || product.isActive === false ? '/wishlist' : `/products/${product._id}`,
              metadata: {
                isActive: product.isActive,
                isSold: product.isSold,
              },
            }
          ),
        ]);
      }
    }

    await logAuditAction({
      action: 'PRODUCT_UPDATED',
      actor: req.user._id,
      targetType: 'Product',
      targetId: product._id,
      details: updates,
      req,
    });

    return res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const wishlistUsers = await User.find({ wishlist: product._id }).select('_id');

    await Promise.all([
      createNotification({
        userId: product.seller,
        actorId: req.user._id,
        productId: product._id,
        type: 'listing_removed',
        title: 'Listing removed by admin',
        message: `Your listing "${product.title}" was removed by admin.`,
        link: '/my-products',
      }),
      createNotifications(wishlistUsers.map((user) => user._id), {
        actorId: req.user._id,
        productId: product._id,
        type: 'wishlist_item_removed',
        title: 'Saved item was removed',
        message: `"${product.title}" was removed from the marketplace.`,
        link: '/wishlist',
        metadata: {
          removedByAdmin: true,
        },
      }),
    ]);

    await User.updateMany(
      { wishlist: product._id },
      {
        $pull: {
          wishlist: product._id,
          recentlyViewed: { product: product._id },
        },
      }
    );

    await Product.findByIdAndDelete(req.params.id);

    await logAuditAction({
      action: 'PRODUCT_DELETED',
      actor: req.user._id,
      targetType: 'Product',
      targetId: req.params.id,
      details: { productTitle: product.title },
      req,
    });

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const { cursor, limit = 50, status = '', search = '' } = req.query;
    const query = {};

    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      query._id = { $lt: cursor };
    }

    if (status) {
      query.status = status;
    }

    const numericLimit = Number(limit);

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      const userMatchIds = await User.find({
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
        ],
      }).select('_id');

      const userIds = userMatchIds.map((user) => user._id);
      query.$or = [
        { 'items.title': { $regex: searchRegex } },
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name email location')
      .sort({ _id: -1 })
      .limit(numericLimit);

    const total = await Order.countDocuments(query);
    const nextCursor = orders.length === numericLimit ? orders[orders.length - 1]._id.toString() : null;

    return res.json({
      orders,
      nextCursor,
      total,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['requested', 'accepted', 'meetup_scheduled', 'completed', 'cancelled', 'no_show'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email location');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    await createNotification({
      userId: order.user._id,
      actorId: req.user._id,
      orderId: order._id,
      type: 'order_status_updated',
      title: 'Order status updated',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${status}.`,
      link: '/orders',
      metadata: {
        status,
      },
    });

    await logAuditAction({
      action: 'ORDER_STATUS_UPDATED',
      actor: req.user._id,
      targetType: 'Order',
      targetId: order._id,
      details: { newStatus: status },
      req,
    });

    return res.json({
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { cursor, limit = 50, status = '', targetType = '' } = req.query;
    const query = {};

    if (cursor) {
      if (!isValidObjectId(cursor)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }
      query._id = { $lt: cursor };
    }

    if (status) {
      query.status = status;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    const numericLimit = Number(limit);
    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('product', 'title images category')
      .populate('message', 'content timestamp')
      .sort({ _id: -1 })
      .limit(numericLimit);

    const total = await Report.countDocuments(query);
    const nextCursor = reports.length === numericLimit ? reports[reports.length - 1]._id.toString() : null;

    return res.json({ 
      reports,
      nextCursor,
      total
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const { status, adminNotes = '' } = req.body;
    const allowedStatuses = ['open', 'reviewed', 'resolved', 'dismissed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid report status' });
    }

    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('product', 'title images category');


    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    report.adminNotes = adminNotes.trim();
    await report.save();

    await createNotification({
      userId: report.reporter._id,
      actorId: req.user._id,
      productId: report.product?._id,
      reportId: report._id,
      type: 'report_status_updated',
      title: 'Report status updated',
      message: `Your ${report.targetType} report is now ${status}.${report.adminNotes ? ' Admin notes were added.' : ''}`,
      link: '/notifications',
      metadata: {
        status,
        targetType: report.targetType,
      },
    });

    await logAuditAction({
      action: 'REPORT_STATUS_UPDATED',
      actor: req.user._id,
      targetType: 'Report',
      targetId: report._id,
      details: { newStatus: status, adminNotes },
      req,
    });

    return res.json({
      message: 'Report updated successfully',
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v')
      .lean();

    const countMap = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countsByCategory = countMap.reduce((acc, entry) => {
      acc[entry._id] = entry.count;
      return acc;
    }, {});

    const rows = categories.map((category) => ({
      ...category,
      productCount: countsByCategory[category.name] || 0,
    }));

    return res.json({ categories: rows });
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

    const AuditLog = require('../../../models/AuditLog');
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

module.exports = {
  getOverview,
  getUsers,
  updateUser,
  suspendUser,
  getSuspiciousUsers,
  getProducts,
  updateProduct,
  deleteProduct,
  getSuspiciousProducts,
  getOrders,
  updateOrder,
  getReports,
  updateReport,
  getCategories,
  getAuditLogs,
};
