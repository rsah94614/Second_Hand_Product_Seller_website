const Product = require('../../../models/Product');
const User = require('../../../models/User');
const Notification = require('../../../models/Notification');
const Report = require('../../../models/Report');
const jwt = require('jsonwebtoken');
const {
  parseContactInfo,
  ensureValidCategory,
  uploadImages,
  cleanupTempFiles,
  notifyWishlistUsers,
  findProducts,
  findRelatedProducts,
} = require('./product.service');
const { detectSuspiciousListing, HIGH_RISK_CATEGORIES } = require('../../shared/utils/riskDetection.utils');
const { createNotifications } = require('../../shared/utils/notification.utils');

const LISTING_EXPIRY_DAYS = 60;

const getBearerToken = (headerValue) => {
  if (!headerValue || typeof headerValue !== 'string') return null;
  return headerValue.replace(/Bearer\s+/i, '').trim() || null;
};

// ─── List / Search ────────────────────────────────────────────────────────────

const listProducts = async (req, res) => {
  try {
    // Auto-expire stale listings on read (lightweight, only updates if needed)
    const now = new Date();
    await Product.updateMany(
      { expiresAt: { $lt: now }, isExpired: false, isActive: true },
      { $set: { isExpired: true, isActive: false } }
    );

    const result = await findProducts(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductsByUser = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.params.userId })
      .populate('seller', 'name location')
      .sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const result = await findRelatedProducts(req.params.id);
    if (!result) return res.status(404).json({ message: 'Product not found' });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: 'seller',
      select: 'name location email reviews averageRating reviewCount createdAt profileRole campus isSuspended',
      populate: { path: 'reviews.user', select: 'name' },
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const token = getBearerToken(req.header('Authorization'));
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded?.userId;
        if (userId && product.viewedBy && !product.viewedBy.some((id) => id.toString() === userId)) {
          product.views += 1;
          product.viewedBy.push(userId);
          await product.save();
        }
        if (userId) {
          await User.findByIdAndUpdate(userId, { $pull: { recentlyViewed: { product: product._id } } });
          await User.findByIdAndUpdate(userId, {
            $push: { recentlyViewed: { $each: [{ product: product._id, viewedAt: new Date() }], $position: 0, $slice: 12 } },
          });
        }
      } catch (err) { /* ignore invalid token */ }
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Report ───────────────────────────────────────────────────────────────────

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

    if (product.seller._id.toString() === req.user._id.toString()) {
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
      reportedUser: product.seller._id,
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
      message: `${req.user.name} reported ${targetType === 'product' ? `"${product.title}"` : product.seller.name}.`,
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

// ─── Create ───────────────────────────────────────────────────────────────────

const createProduct = async (req, res) => {
  const tempFilePaths = (req.files || []).map((f) => f.path).filter(Boolean);

  try {
    const { title, description, category, condition, price, contactInfo, stock = 1 } = req.body;

    // ── Image requirement ─────────────────────────────────────────────────
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one image' });
    }

    const isHighRisk = HIGH_RISK_CATEGORIES.includes(category);
    if (isHighRisk && req.files.length < 2) {
      return res.status(400).json({
        message: `At least 2 photos are required for "${category}" listings to ensure buyers can verify the item.`,
        code: 'MIN_IMAGES_REQUIRED',
      });
    }

    const validCategory = await ensureValidCategory(category);
    if (!validCategory) {
      return res.status(400).json({ message: 'Please choose a valid active category' });
    }

    // ── Risk heuristics ───────────────────────────────────────────────────
    const seller = await User.findById(req.user._id).select('createdAt');
    const ageDays = (Date.now() - new Date(seller.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const openReportCount = await Report.countDocuments({
      reportedUser: req.user._id,
      status: { $in: ['open', 'reviewed'] },
    });
    const activeListingCount = await Product.countDocuments({
      seller: req.user._id, isActive: true, isSold: false,
    });

    const { riskScore, riskFlags, reasons } = await detectSuspiciousListing({
      title, category,
      price: Number(price),
      sellerAccountAgeDays: ageDays,
      sellerOpenReports: openReportCount,
      sellerActiveListings: activeListingCount,
      sellerId: req.user._id.toString(),
    });

    const uploadedImages = await uploadImages(req.files);
    const expiresAt = new Date(Date.now() + LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const productData = {
      title, description, category, condition,
      price: Number(price),
      stock: Number(stock),
      contactInfo: parseContactInfo(contactInfo),
      images: uploadedImages,
      seller: req.user._id,
      expiresAt,
      riskScore,
      flagged: riskScore >= 60,
      flaggedReason: riskScore >= 60 ? reasons.join('; ') : '',
    };

    const product = new Product(productData);
    await product.save();

    // Update new-user daily listing counter
    if (req.newUserListingMeta !== undefined) {
      await User.findByIdAndUpdate(req.user._id, {
        listingsCreatedToday: req.newUserListingMeta.todayCount + 1,
        lastListingDate: new Date(),
      });
    }

    // Notify admins if high risk
    if (riskScore >= 60) {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      if (admins.length) {
        await createNotifications(admins.map((a) => a._id), {
          actorId: req.user._id,
          productId: product._id,
          type: 'suspicious_listing',
          title: 'Suspicious listing detected',
          message: `"${title}" scored ${riskScore}/100 risk. Reasons: ${reasons.join('; ')}`,
          link: '/admin/products',
          metadata: { riskScore, riskFlags },
        });
      }
    }

    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'name location');

    return res.status(201).json(populatedProduct);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    return res.status(500).json({ message: error.message });
  } finally {
    cleanupTempFiles(tempFilePaths);
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateProduct = async (req, res) => {
  const tempFilePaths = (req.files || []).map((f) => f.path).filter(Boolean);

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const previousPrice = product.price;
    const previousIsActive = product.isActive;
    const previousIsSold = product.isSold;

    let uploadedImages = [];
    if (req.files?.length) uploadedImages = await uploadImages(req.files);

    let existingImages = req.body.existingImages || [];
    if (!Array.isArray(existingImages)) existingImages = existingImages ? [existingImages] : [];

    const validCategory = await ensureValidCategory(req.body.category);
    if (!validCategory) return res.status(400).json({ message: 'Please choose a valid active category' });

    // Image min check for high-risk on update too
    const newCategory = req.body.category || product.category;
    const allImages = [...existingImages, ...uploadedImages];
    if (HIGH_RISK_CATEGORIES.includes(newCategory) && allImages.length < 2) {
      return res.status(400).json({
        message: `At least 2 photos are required for "${newCategory}" listings.`,
        code: 'MIN_IMAGES_REQUIRED',
      });
    }

    if (allImages.length === 0) {
      return res.status(400).json({ message: 'Please keep at least one image' });
    }

    const contactInfo = parseContactInfo(req.body.contactInfo);

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, contactInfo, images: allImages, stock: req.body.stock !== undefined ? Number(req.body.stock) : product.stock },
      { new: true, runValidators: true }
    ).populate('seller', 'name location');

    const nextPrice = Number(updatedProduct.price);
    if (Number.isFinite(nextPrice) && Number(previousPrice) !== nextPrice) {
      const priceDirection = nextPrice < Number(previousPrice) ? 'dropped' : 'changed';
      await notifyWishlistUsers({
        productId: updatedProduct._id,
        actorId: req.user._id,
        type: 'wishlist_price_update',
        title: nextPrice < Number(previousPrice) ? 'Price dropped on a saved item' : 'Price changed on a saved item',
        message: `"${updatedProduct.title}" ${priceDirection} from ₹${Number(previousPrice)} to ₹${nextPrice}.`,
        link: `/products/${updatedProduct._id}`,
        metadata: { previousPrice: Number(previousPrice), nextPrice },
        excludeUserIds: [req.user._id],
      });
    }

    if (previousIsActive !== updatedProduct.isActive || previousIsSold !== updatedProduct.isSold) {
      let type = 'wishlist_listing_update';
      let title = 'Saved listing updated';
      let message = `"${updatedProduct.title}" was updated.`;

      if (updatedProduct.isSold) {
        type = 'wishlist_item_sold'; title = 'Saved item was marked sold';
        message = `"${updatedProduct.title}" is no longer available.`;
      } else if (!updatedProduct.isActive) {
        type = 'wishlist_item_unavailable'; title = 'Saved item became unavailable';
        message = `"${updatedProduct.title}" is currently unavailable.`;
      } else {
        type = 'wishlist_item_available'; title = 'Saved item is available again';
        message = `"${updatedProduct.title}" is active again.`;
      }

      await notifyWishlistUsers({
        productId: updatedProduct._id, actorId: req.user._id, type, title, message,
        link: `/products/${updatedProduct._id}`,
        metadata: { isActive: updatedProduct.isActive, isSold: updatedProduct.isSold },
        excludeUserIds: [req.user._id],
      });
    }

    return res.json(updatedProduct);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', errors: messages });
    }
    return res.status(500).json({ message: error.message });
  } finally {
    cleanupTempFiles(tempFilePaths);
  }
};

// ─── Relist ───────────────────────────────────────────────────────────────────

const relistProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Anti-spam: max 3 relists per 30 days per listing
    if (product.relistCount >= 3) {
      const daysSinceFirstRelist = product.relistedAt
        ? (Date.now() - new Date(product.relistedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;
      if (daysSinceFirstRelist < 30) {
        return res.status(429).json({
          message: 'This listing has been relisted too many times. You can relist again after 30 days.',
          code: 'RELIST_CAP',
        });
      }
      // Reset relist counter after 30-day window
      product.relistCount = 0;
    }

    const newExpiry = new Date(Date.now() + LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    product.isActive = true;
    product.isExpired = false;
    product.isSold = false;
    product.expiresAt = newExpiry;
    product.relistedAt = new Date();
    product.relistCount += 1;
    await product.save();

    const populatedProduct = await Product.findById(product._id).populate('seller', 'name location');
    return res.json({
      message: `Listing relisted successfully. It will expire on ${newExpiry.toLocaleDateString('en-IN')}.`,
      product: populatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Status / Delete ──────────────────────────────────────────────────────────

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

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notifyWishlistUsers({
      productId: product._id, actorId: req.user._id,
      type: 'wishlist_item_removed', title: 'Saved item was removed',
      message: `"${product.title}" is no longer available because the listing was removed.`,
      link: '/wishlist', metadata: { removed: true }, excludeUserIds: [req.user._id],
    });

    await User.updateMany(
      { wishlist: product._id },
      { $pull: { wishlist: product._id, recentlyViewed: { product: product._id } } }
    );
    await Notification.deleteMany({ product: product._id });
    await Product.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listProducts,
  getProductsByUser,
  getRelatedProducts,
  getProduct,
  reportProduct,
  createProduct,
  updateProduct,
  relistProduct,
  updateProductStatus,
  deleteProduct,
};
