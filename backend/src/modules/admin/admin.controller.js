const mongoose = require('mongoose');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Order = require('../../../models/Order');
const Category = require('../../../models/Category');
const Report = require('../../../models/Report');
const ModerationQueue = require('../../../models/ModerationQueue');
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

// ─── Moderation Queue (Task 2.5.1) ───────────────────────────────────────────

const getModerationQueue = async (req, res) => {
  try {
    const { status, priority, itemType, assignedTo } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (itemType) query.itemType = itemType;
    if (assignedTo === 'me') {
      query.assignedTo = req.user._id;
    } else if (assignedTo === 'unassigned') {
      query.assignedTo = null;
    } else if (assignedTo && isValidObjectId(assignedTo)) {
      query.assignedTo = assignedTo;
    }

    const items = await ModerationQueue.find(query)
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .limit(100);

    const stats = await ModerationQueue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return res.json({
      items,
      stats: {
        pending: statusCounts.pending || 0,
        in_progress: statusCounts.in_progress || 0,
        resolved: statusCounts.resolved || 0,
        total: items.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addToModerationQueue = async (req, res) => {
  try {
    const { itemType, itemId, reason, priority = 'medium', metadata = {} } = req.body;

    // Validate itemType
    const validTypes = ['product', 'user', 'order', 'review', 'report'];
    if (!validTypes.includes(itemType)) {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    if (!itemId || !isValidObjectId(itemId)) {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    // Check if item already in queue
    const existing = await ModerationQueue.findOne({
      itemType,
      itemId,
      status: { $in: ['pending', 'in_progress'] },
    });

    if (existing) {
      return res.status(400).json({ message: 'Item already in moderation queue' });
    }

    const queueItem = await ModerationQueue.create({
      itemType,
      itemId,
      reason: reason.trim(),
      priority,
      metadata,
    });

    await logAuditAction({
      action: 'MODERATION_QUEUE_ADDED',
      actor: req.user._id,
      targetType: 'ModerationQueue',
      targetId: queueItem._id,
      details: { itemType, itemId, reason, priority },
      req,
    });

    return res.status(201).json({
      message: 'Item added to moderation queue',
      item: queueItem,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const assignModerationItem = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (adminId && !isValidObjectId(adminId)) {
      return res.status(400).json({ message: 'Invalid admin ID' });
    }

    const item = await ModerationQueue.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Moderation item not found' });
    }

    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Cannot assign resolved item' });
    }

    // If adminId provided, assign to that admin, otherwise assign to self
    item.assignedTo = adminId || req.user._id;
    item.status = 'in_progress';
    await item.save();

    const populatedItem = await ModerationQueue.findById(item._id).populate('assignedTo', 'name email');

    await logAuditAction({
      action: 'MODERATION_ITEM_ASSIGNED',
      actor: req.user._id,
      targetType: 'ModerationQueue',
      targetId: item._id,
      details: { assignedTo: item.assignedTo },
      req,
    });

    return res.json({
      message: 'Moderation item assigned',
      item: populatedItem,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resolveModerationItem = async (req, res) => {
  try {
    const { resolution } = req.body;

    if (!resolution?.trim()) {
      return res.status(400).json({ message: 'Resolution is required' });
    }

    const item = await ModerationQueue.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Moderation item not found' });
    }

    if (item.status === 'resolved') {
      return res.status(400).json({ message: 'Item already resolved' });
    }

    item.status = 'resolved';
    item.resolution = resolution.trim();
    item.resolvedAt = new Date();
    await item.save();

    await logAuditAction({
      action: 'MODERATION_ITEM_RESOLVED',
      actor: req.user._id,
      targetType: 'ModerationQueue',
      targetId: item._id,
      details: { resolution },
      req,
    });

    return res.json({
      message: 'Moderation item resolved',
      item,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getModerationStats = async (req, res) => {
  try {
    const [statusStats, priorityStats, typeStats, assignmentStats] = await Promise.all([
      ModerationQueue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ModerationQueue.aggregate([
        { $match: { status: { $ne: 'resolved' } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      ModerationQueue.aggregate([
        { $match: { status: { $ne: 'resolved' } } },
        { $group: { _id: '$itemType', count: { $sum: 1 } } },
      ]),
      ModerationQueue.aggregate([
        { $match: { status: { $ne: 'resolved' } } },
        {
          $group: {
            _id: { $cond: [{ $eq: ['$assignedTo', null] }, 'unassigned', 'assigned'] },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      byStatus: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: priorityStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byAssignment: assignmentStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Automated Moderation Rules (Task 2.5.2) ────────────────────────────────

const Rule = require('../../../models/Rule');

const getRules = async (req, res) => {
  try {
    const { isActive, type } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (type) {
      query.type = type;
    }

    const rules = await Rule.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ rules });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createRule = async (req, res) => {
  try {
    const { name, description, type, condition, action, severity, appliesTo, metadata } = req.body;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Rule name is required' });
    }

    if (!type || !['keyword', 'pattern', 'behavior'].includes(type)) {
      return res.status(400).json({ message: 'Invalid rule type' });
    }

    if (!condition?.trim()) {
      return res.status(400).json({ message: 'Rule condition is required' });
    }

    if (!action || !['flag', 'suspend', 'delete', 'queue'].includes(action)) {
      return res.status(400).json({ message: 'Invalid rule action' });
    }

    const rule = await Rule.create({
      name: name.trim(),
      description: description?.trim() || '',
      type,
      condition: condition.trim(),
      action,
      severity: severity || 'medium',
      appliesTo: appliesTo || ['product'],
      metadata: metadata || {},
      createdBy: req.user._id,
    });

    const populatedRule = await Rule.findById(rule._id).populate('createdBy', 'name email');

    await logAuditAction({
      action: 'RULE_CREATED',
      actor: req.user._id,
      targetType: 'Rule',
      targetId: rule._id,
      details: { name, type, action },
      req,
    });

    return res.status(201).json({
      message: 'Rule created successfully',
      rule: populatedRule,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateRule = async (req, res) => {
  try {
    const { name, description, condition, action, severity, appliesTo, metadata } = req.body;

    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    // Update fields
    if (name?.trim()) rule.name = name.trim();
    if (description !== undefined) rule.description = description.trim();
    if (condition?.trim()) rule.condition = condition.trim();
    if (action && ['flag', 'suspend', 'delete', 'queue'].includes(action)) {
      rule.action = action;
    }
    if (severity && ['low', 'medium', 'high'].includes(severity)) {
      rule.severity = severity;
    }
    if (appliesTo) rule.appliesTo = appliesTo;
    if (metadata) rule.metadata = metadata;

    await rule.save();

    const populatedRule = await Rule.findById(rule._id).populate('createdBy', 'name email');

    await logAuditAction({
      action: 'RULE_UPDATED',
      actor: req.user._id,
      targetType: 'Rule',
      targetId: rule._id,
      details: { name: rule.name },
      req,
    });

    return res.json({
      message: 'Rule updated successfully',
      rule: populatedRule,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    await Rule.findByIdAndDelete(req.params.id);

    await logAuditAction({
      action: 'RULE_DELETED',
      actor: req.user._id,
      targetType: 'Rule',
      targetId: req.params.id,
      details: { name: rule.name },
      req,
    });

    return res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleRule = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Rule not found' });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    const populatedRule = await Rule.findById(rule._id).populate('createdBy', 'name email');

    await logAuditAction({
      action: rule.isActive ? 'RULE_ENABLED' : 'RULE_DISABLED',
      actor: req.user._id,
      targetType: 'Rule',
      targetId: rule._id,
      details: { name: rule.name, isActive: rule.isActive },
      req,
    });

    return res.json({
      message: `Rule ${rule.isActive ? 'enabled' : 'disabled'} successfully`,
      rule: populatedRule,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Seller Verification (Task 2.7.1) ────────────────────────────────────────

const getSellerVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      query.sellerVerificationStatus = status;
    } else {
      // Default to pending
      query.sellerVerificationStatus = 'pending';
    }

    const users = await User.find(query)
      .select('name email sellerVerificationStatus sellerVerificationRequestedAt sellerVerificationDate sellerVerificationReason averageRating reviewCount')
      .sort({ sellerVerificationRequestedAt: -1 })
      .limit(100);

    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const approveSellerVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.sellerVerificationStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending verification request for this user' });
    }

    user.sellerVerified = true;
    user.sellerVerificationStatus = 'verified';
    user.sellerVerificationDate = new Date();
    user.sellerVerificationReason = '';
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

    return res.json({
      message: 'Seller verification approved',
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const rejectSellerVerification = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.sellerVerificationStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending verification request for this user' });
    }

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

    return res.json({
      message: 'Seller verification rejected',
      user,
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
  getModerationQueue,
  addToModerationQueue,
  assignModerationItem,
  resolveModerationItem,
  getModerationStats,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getSellerVerifications,
  approveSellerVerification,
  rejectSellerVerification,
};

// ─── Admin Activity Timeline (Phase 3 - Task 3.3.1) ──────────────────────────

const AdminActivity = require('../../../models/AdminActivity');

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

// ─── Bulk Actions (Phase 3 - Task 3.3.2) ─────────────────────────────────────

const bulkSuspendUsers = async (req, res) => {
  try {
    const { userIds, suspended = true, reason = '' } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    if (userIds.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 users per bulk action' });
    }

    const invalidIds = userIds.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: 'Invalid user IDs provided' });
    }

    // Prevent suspending admins or self
    const targets = await User.find({
      _id: { $in: userIds },
      role: { $ne: 'admin' },
      _id: { $ne: req.user._id },
    }).select('_id name');

    const safeIds = targets.map((u) => u._id);

    await User.updateMany(
      { _id: { $in: safeIds } },
      {
        $set: {
          isSuspended: suspended,
          suspendedReason: suspended ? reason.trim() : '',
          ...(suspended ? { suspendedAt: new Date() } : {}),
        },
      }
    );

    // Log activity
    await AdminActivity.create({
      admin: req.user._id,
      action: suspended ? 'BULK_SUSPEND_USERS' : 'BULK_UNSUSPEND_USERS',
      targetType: 'Bulk',
      affectedIds: safeIds,
      details: { count: safeIds.length, reason },
      ip: req.ip,
    });

    await logAuditAction({
      action: suspended ? 'BULK_USERS_SUSPENDED' : 'BULK_USERS_UNSUSPENDED',
      actor: req.user._id,
      targetType: 'User',
      targetId: null,
      details: { count: safeIds.length, reason },
      req,
    });

    return res.json({
      message: `${safeIds.length} user(s) ${suspended ? 'suspended' : 'unsuspended'} successfully`,
      affectedCount: safeIds.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'productIds array is required' });
    }

    if (productIds.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 products per bulk action' });
    }

    const invalidIds = productIds.filter((id) => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ message: 'Invalid product IDs provided' });
    }

    const products = await Product.find({ _id: { $in: productIds } }).select('_id title seller');

    // Notify sellers
    const notifications = products.map((p) =>
      createNotification({
        userId: p.seller,
        actorId: req.user._id,
        productId: p._id,
        type: 'listing_removed',
        title: 'Listing removed by admin',
        message: `Your listing "${p.title}" was removed by admin.`,
        link: '/my-products',
      })
    );
    await Promise.allSettled(notifications);

    await Product.deleteMany({ _id: { $in: productIds } });

    // Log activity
    await AdminActivity.create({
      admin: req.user._id,
      action: 'BULK_DELETE_PRODUCTS',
      targetType: 'Bulk',
      affectedIds: productIds,
      details: { count: products.length },
      ip: req.ip,
    });

    await logAuditAction({
      action: 'BULK_PRODUCTS_DELETED',
      actor: req.user._id,
      targetType: 'Product',
      targetId: null,
      details: { count: products.length },
      req,
    });

    return res.json({
      message: `${products.length} product(s) deleted successfully`,
      affectedCount: products.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'productIds array is required' });
    }

    if (productIds.length > 50) {
      return res.status(400).json({ message: 'Maximum 50 products per bulk action' });
    }

    // Only allow safe bulk updates
    const allowedUpdates = {};
    if (updates.isActive !== undefined) allowedUpdates.isActive = Boolean(updates.isActive);
    if (updates.isSold !== undefined) allowedUpdates.isSold = Boolean(updates.isSold);
    if (updates.flagged !== undefined) allowedUpdates.flagged = Boolean(updates.flagged);

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    await Product.updateMany({ _id: { $in: productIds } }, { $set: allowedUpdates });

    await AdminActivity.create({
      admin: req.user._id,
      action: 'BULK_UPDATE_PRODUCTS',
      targetType: 'Bulk',
      affectedIds: productIds,
      details: { count: productIds.length, updates: allowedUpdates },
      ip: req.ip,
    });

    await logAuditAction({
      action: 'BULK_PRODUCTS_UPDATED',
      actor: req.user._id,
      targetType: 'Product',
      targetId: null,
      details: { count: productIds.length, updates: allowedUpdates },
      req,
    });

    return res.json({
      message: `${productIds.length} product(s) updated successfully`,
      affectedCount: productIds.length,
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
  getModerationQueue,
  addToModerationQueue,
  assignModerationItem,
  resolveModerationItem,
  getModerationStats,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  getSellerVerifications,
  approveSellerVerification,
  rejectSellerVerification,
  getActivityTimeline,
  bulkSuspendUsers,
  bulkDeleteProducts,
  bulkUpdateProducts,
};
