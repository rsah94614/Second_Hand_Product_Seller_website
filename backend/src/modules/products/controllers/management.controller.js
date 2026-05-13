const Product = require('../../../../models/Product');
const User = require('../../../../models/User');
const Report = require('../../../../models/Report');
const { notifyWishlistUsers } = require('../product.service');
const { createNotifications } = require('../../../shared/utils/notification.utils');

const updateProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const previousIsActive = product.isActive;
    const previousIsSold = product.isSold;
    if (req.body.isActive !== undefined) product.isActive = req.body.isActive;
    if (req.body.isSold !== undefined) product.isSold = req.body.isSold;
    await product.save();

    if (previousIsActive !== product.isActive || previousIsSold !== product.isSold) {
      let type = 'wishlist_listing_update', title = 'Saved listing updated', message = `"${product.title}" was updated.`;
      if (product.isSold) {
        type = 'wishlist_item_sold'; title = 'Saved item was marked sold';
        message = `"${product.title}" is no longer available.`;
      } else if (!product.isActive) {
        type = 'wishlist_item_unavailable'; title = 'Saved item became unavailable';
        message = `"${product.title}" is currently unavailable.`;
      } else {
        type = 'wishlist_item_available'; title = 'Saved item is available again';
        message = `"${product.title}" is active again.`;
      }
      await notifyWishlistUsers({
        productId: product._id, actorId: req.user._id, type, title, message,
        link: `/products/${product._id}`,
        metadata: { isActive: product.isActive, isSold: product.isSold },
        excludeUserIds: [req.user._id],
      });
    }

    const populated = await Product.findById(product._id).populate('seller', 'name location');
    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const reportProduct = async (req, res) => {
  try {
    const { targetType, reason, details = '' } = req.body;

    if (!['product', 'user'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid report target' });
    }
    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Please provide a reason for the report' });
    }

    const product = await Product.findById(req.params.id).populate('seller', '_id name');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!product.seller) {
      if (targetType === 'user') {
        return res.status(400).json({ message: 'Cannot report seller: Seller account no longer exists.' });
      }
    }

    if (product.seller && product.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report your own listing' });
    }

    const existingReport = await Report.findOne({
      reporter: req.user._id,
      product: product._id,
      targetType,
      status: { $in: ['open', 'reviewed'] },
    });
    if (existingReport) {
      return res.status(400).json({ message: 'You already submitted an active report for this item' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      product: product._id,
      reportedUser: product.seller?._id,
      targetType,
      reason: reason.trim(),
      details: details.trim(),
    });

    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await createNotifications(admins.map((a) => a._id), {
      actorId: req.user._id,
      productId: product._id,
      reportId: report._id,
      type: 'new_report',
      title: 'New report submitted',
      message: `${req.user.name} reported ${targetType === 'product' ? `"${product.title}"` : (product.seller?.name || 'Unknown Seller')}.`,
      link: '/admin/reports',
      metadata: { targetType, reason: reason.trim() },
    });

    return res.status(201).json({
      message: targetType === 'product'
        ? 'Product reported. Our moderators will review it.'
        : 'User reported. Our moderators will review it.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateProductStatus,
  reportProduct,
};
