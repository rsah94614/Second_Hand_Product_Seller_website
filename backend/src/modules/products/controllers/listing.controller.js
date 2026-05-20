const Product = require('../../../../models/Product');
const User = require('../../../../models/User');
const Notification = require('../../../../models/Notification');
const Report = require('../../../../models/Report');
const {
  parseContactInfo,
  ensureValidCategory,
  uploadImages,
  cleanupTempFiles,
  notifyWishlistUsers,
  LISTING_EXPIRY_DAYS,
} = require('../product.service');
const { detectSuspiciousListing, HIGH_RISK_CATEGORIES } = require('../../../shared/utils/riskDetection.utils');
const { createNotifications } = require('../../../shared/utils/notification.utils');
const { checkAndApplyRules } = require('../../../services/ruleEngine.service');

const createProduct = async (req, res) => {
  const tempFilePaths = (req.files || []).map((f) => f.path).filter(Boolean);

  try {
    const { title, description, category, condition, price, contactInfo, location, stock = 1 } = req.body;

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
      location: location || '',
      images: uploadedImages,
      seller: req.user._id,
      expiresAt,
      riskScore,
      flagged: riskScore >= 60,
      flaggedReason: riskScore >= 60 ? reasons.join('; ') : '',
    };

    const product = new Product(productData);
    await product.save();

    const ruleResults = await checkAndApplyRules(product, 'product');
    if (ruleResults.length > 0) {
      await product.save();
      console.log(`Applied ${ruleResults.length} rule(s) to product ${product._id}:`, 
        ruleResults.map(r => `${r.rule} (${r.action})`).join(', ')
      );
    }

    if (req.newUserListingMeta !== undefined) {
      await User.findByIdAndUpdate(req.user._id, {
        listingsCreatedToday: req.newUserListingMeta.todayCount + 1,
        lastListingDate: new Date(),
      });
    }

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

    const categoryToCheck = req.body.category || product.category;
    const validCategory = await ensureValidCategory(categoryToCheck);
    if (!validCategory) return res.status(400).json({ message: 'Please choose a valid active category' });

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

    const ruleResults = await checkAndApplyRules(updatedProduct, 'product');
    if (ruleResults.length > 0) {
      await updatedProduct.save();
      console.log(`Applied ${ruleResults.length} rule(s) to updated product ${updatedProduct._id}:`, 
        ruleResults.map(r => `${r.rule} (${r.action})`).join(', ')
      );
    }

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

      if (!previousIsSold && updatedProduct.isSold) {
        type = 'wishlist_item_sold'; title = 'Saved item was marked sold';
        message = `"${updatedProduct.title}" is no longer available.`;
      } else if (previousIsActive && !updatedProduct.isActive) {
        type = 'wishlist_item_unavailable'; title = 'Saved item became unavailable';
        message = `"${updatedProduct.title}" is currently unavailable.`;
      } else if (!previousIsActive && updatedProduct.isActive) {
        type = 'wishlist_item_available'; title = 'Saved item is available again';
        message = `"${updatedProduct.title}" is active again.`;
      } else {
        type = 'wishlist_listing_update'; title = 'Saved listing updated';
        message = `"${updatedProduct.title}" was updated.`;
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

const relistProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

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
  createProduct,
  updateProduct,
  relistProduct,
  deleteProduct,
};
