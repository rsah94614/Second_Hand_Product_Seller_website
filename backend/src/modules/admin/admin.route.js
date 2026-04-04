const express = require('express');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const Order = require('../../../models/Order');
const Category = require('../../../models/Category');
const Report = require('../../../models/Report');
const { adminAuth } = require('../../shared/middleware/auth.middleware');
const { ensureDefaultCategories } = require('../../../utils/categoryDefaults');
const {
  createNotification,
  createNotifications,
} = require('../../shared/utils/notification.utils');

const router = express.Router();

router.get('/overview', adminAuth, async (req, res) => {
  try {
    await ensureDefaultCategories();
    const [users, products, orders, reports] = await Promise.all([
      User.find().select('_id name email role isActive createdAt'),
      Product.find().select('_id title category isActive isSold views createdAt price images location'),
      Order.find().select('_id total status createdAt'),
      Report.find().select('_id status'),
    ]);

    const metrics = {
      totalUsers: users.length,
      totalMembers: users.filter((user) => user.role === 'user').length,
      totalAdmins: users.filter((user) => user.role === 'admin').length,
      totalProducts: products.length,
      activeProducts: products.filter((product) => product.isActive && !product.isSold).length,
      soldProducts: products.filter((product) => product.isSold).length,
      inactiveProducts: products.filter((product) => !product.isActive && !product.isSold).length,
      totalOrders: orders.length,
      processingOrders: orders.filter((order) => order.status === 'processing').length,
      deliveredOrders: orders.filter((order) => order.status === 'delivered').length,
      openReports: reports.filter((report) => ['open', 'reviewed'].includes(report.status)).length,
      totalRevenue: orders
        .filter((order) => order.status !== 'cancelled')
        .reduce((sum, order) => sum + (order.total || 0), 0),
    };

    const topProducts = [...products]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    const recentUsers = [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const categoryBreakdown = Object.entries(
      products.reduce((acc, product) => {
        const key = product.category || 'Other';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

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
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      status = '',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === 'active') {
      query.isActive = true;
    }

    if (status === 'inactive') {
      query.isActive = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    return res.json({
      users,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/users/:id', adminAuth, async (req, res) => {
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

    return res.json({
      message: 'User updated successfully',
      user: targetUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/products', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { location: new RegExp(search, 'i') },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status === 'active') {
      query.isActive = true;
      query.isSold = false;
    }

    if (status === 'inactive') {
      query.isActive = false;
    }

    if (status === 'sold') {
      query.isSold = true;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    return res.json({
      products,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      search = '',
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    const filteredOrders = search
      ? orders.filter((order) => {
          const queryText = search.toLowerCase();
          const orderCode = order._id.toString().slice(-6).toLowerCase();
          const buyerName = order.user?.name?.toLowerCase() || '';
          const buyerEmail = order.user?.email?.toLowerCase() || '';
          const itemTitles = (order.items || []).map((item) => item.title?.toLowerCase() || '').join(' ');

          return (
            orderCode.includes(queryText) ||
            buyerName.includes(queryText) ||
            buyerEmail.includes(queryText) ||
            itemTitles.includes(queryText)
          );
        })
      : orders;

    return res.json({
      orders: filteredOrders,
      total: search ? filteredOrders.length : total,
      currentPage: Number(page),
      totalPages: Math.ceil((search ? filteredOrders.length : total) / Number(limit)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/orders/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email phone location');

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

    return res.json({
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/products/:id', adminAuth, async (req, res) => {
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

    return res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/products/:id', adminAuth, async (req, res) => {
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

    await Product.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/categories', adminAuth, async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v');

    const rows = await Promise.all(
      categories.map(async (category) => ({
        ...category.toObject(),
        productCount: await Product.countDocuments({ category: category.name }),
      }))
    );

    return res.json({ categories: rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/reports', adminAuth, async (req, res) => {
  try {
    const { status = '', targetType = '' } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('product', 'title images category')
      .sort({ createdAt: -1 });

    return res.json({ reports });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/reports/:id', adminAuth, async (req, res) => {
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

    return res.json({
      message: 'Report updated successfully',
      report,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
