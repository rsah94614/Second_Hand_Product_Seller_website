const User = require('../../../../models/User');
const Product = require('../../../../models/Product');
const AdminActivity = require('../../../../models/AdminActivity');
const { logAuditAction } = require('../../../shared/utils/audit.utils');
const { createNotification, createNotifications } = require('../../../shared/utils/notification.utils');
const mongoose = require('mongoose');

const escapeRegex = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const getProducts = async (req, res) => {
  try {
    const { cursor, limit = 50, category, status, search } = req.query;
    const query = {};

    if (cursor && isValidObjectId(cursor)) query._id = { $lt: cursor };
    if (category) query.category = category;

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
      query.$or = [{ title: { $regex: searchRegex } }, { description: { $regex: searchRegex } }];
    }

    const numericLimit = Number(limit);
    const products = await Product.find(query).populate('seller', 'name email').sort({ _id: -1 }).limit(numericLimit);
    const total = await Product.countDocuments(query);
    const nextCursor = products.length === numericLimit ? products[products.length - 1]._id.toString() : null;

    return res.json({ products, nextCursor, total });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSuspiciousProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ flagged: true }, { riskScore: { $gte: 40 } }]
    }).populate('seller', 'name email').sort({ riskScore: -1 }).limit(100);
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const updates = {};
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    if (req.body.isSold !== undefined) updates.isSold = Boolean(req.body.isSold);

    const currentProduct = await Product.findById(req.params.id).select('title isActive isSold seller');
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('seller', 'name email');

    if (!product) return res.status(404).json({ message: 'Product not found' });

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
            metadata: { isActive: product.isActive, isSold: product.isSold },
          }),
          createNotifications(
            (await User.find({ wishlist: product._id }).select('_id'))
              .map(u => u._id)
              .filter(id => id.toString() !== product.seller._id.toString()),
            {
              actorId: req.user._id,
              productId: product._id,
              type: product.isSold ? 'wishlist_item_sold' : product.isActive === false ? 'wishlist_item_unavailable' : 'wishlist_item_available',
              title: product.isSold ? 'Saved item was marked sold' : product.isActive === false ? 'Saved item became unavailable' : 'Saved item is available again',
              message: product.isSold ? `"${product.title}" is no longer available because it was marked sold.` : product.isActive === false ? `"${product.title}" is currently unavailable.` : `"${product.title}" is active again.`,
              link: product.isSold || product.isActive === false ? '/wishlist' : `/products/${product._id}`,
              metadata: { isActive: product.isActive, isSold: product.isSold },
            }
          ),
        ]);
      }
    }

    await logAuditAction({ action: 'PRODUCT_UPDATED', actor: req.user._id, targetType: 'Product', targetId: product._id, details: updates, req });
    return res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

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
      createNotifications(wishlistUsers.map(u => u._id), {
        actorId: req.user._id,
        productId: product._id,
        type: 'wishlist_item_removed',
        title: 'Saved item was removed',
        message: `"${product.title}" was removed from the marketplace.`,
        link: '/wishlist',
        metadata: { removedByAdmin: true },
      }),
    ]);

    await User.updateMany({ wishlist: product._id }, { $pull: { wishlist: product._id, recentlyViewed: { product: product._id } } });
    await Product.findByIdAndDelete(req.params.id);

    await logAuditAction({ action: 'PRODUCT_DELETED', actor: req.user._id, targetType: 'Product', targetId: req.params.id, details: { productTitle: product.title }, req });
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) return res.status(400).json({ message: 'productIds array is required' });
    if (productIds.length > 50) return res.status(400).json({ message: 'Maximum 50 products per bulk action' });

    const products = await Product.find({ _id: { $in: productIds } }).select('_id title seller');
    const notifications = products.map(p => createNotification({
      userId: p.seller, actorId: req.user._id, productId: p._id, type: 'listing_removed',
      title: 'Listing removed by admin', message: `Your listing "${p.title}" was removed by admin.`, link: '/my-products'
    }));
    await Promise.allSettled(notifications);

    await Product.deleteMany({ _id: { $in: productIds } });
    await AdminActivity.create({ admin: req.user._id, action: 'BULK_DELETE_PRODUCTS', targetType: 'Bulk', affectedIds: productIds, details: { count: products.length }, ip: req.ip });

    return res.json({ message: `${products.length} product(s) deleted successfully`, affectedCount: products.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;
    if (!Array.isArray(productIds) || productIds.length === 0) return res.status(400).json({ message: 'productIds array is required' });
    if (productIds.length > 50) return res.status(400).json({ message: 'Maximum 50 products per bulk action' });

    const allowedUpdates = {};
    if (updates.isActive !== undefined) allowedUpdates.isActive = Boolean(updates.isActive);
    if (updates.isSold !== undefined) allowedUpdates.isSold = Boolean(updates.isSold);
    if (updates.flagged !== undefined) allowedUpdates.flagged = Boolean(updates.flagged);

    if (Object.keys(allowedUpdates).length === 0) return res.status(400).json({ message: 'No valid updates provided' });

    await Product.updateMany({ _id: { $in: productIds } }, { $set: allowedUpdates });
    await AdminActivity.create({ admin: req.user._id, action: 'BULK_UPDATE_PRODUCTS', targetType: 'Bulk', affectedIds: productIds, details: { count: productIds.length, updates: allowedUpdates }, ip: req.ip });

    return res.json({ message: `${productIds.length} product(s) updated successfully`, affectedCount: productIds.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getSuspiciousProducts, updateProduct, deleteProduct, bulkDeleteProducts, bulkUpdateProducts };
