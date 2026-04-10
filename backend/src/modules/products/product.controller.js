const Product = require('../../../models/Product');
const User = require('../../../models/User');
const Notification = require('../../../models/Notification');
const jwt = require('jsonwebtoken');
const {
  createNotification,
} = require('../../shared/utils/notification.utils');
const {
  recalculateReviewStats,
  parseContactInfo,
  ensureValidCategory,
  uploadImages,
  cleanupTempFiles,
  notifyWishlistUsers,
  findProducts,
  findRelatedProducts,
} = require('./product.service');

const listProducts = async (req, res) => {
  try {
    const result = await findProducts(req.query);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

const getProductsByUser = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.params.userId })
      .populate('seller', 'name phone location')
      .sort({ createdAt: -1 });

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const result = await findRelatedProducts(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name phone location email')
      .populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const hasViewed = product.viewedBy.some((viewerId) => viewerId.toString() === userId);

        if (!hasViewed) {
          product.views += 1;
          product.viewedBy.push(userId);
          await product.save();
        }

        await User.findByIdAndUpdate(userId, {
          $pull: { recentlyViewed: { product: product._id } },
        });

        await User.findByIdAndUpdate(userId, {
          $push: {
            recentlyViewed: {
              $each: [{ product: product._id, viewedAt: new Date() }],
              $position: 0,
              $slice: 12,
            },
          },
        });
      } catch (err) {
        console.log('Invalid token for view tracking', err.message);
      }
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { rating, comment = '' } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot review your own product' });
    }

    const existingReview = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment.trim();
    } else {
      product.reviews.push({
        user: req.user._id,
        rating: numericRating,
        comment: comment.trim(),
      });
    }

    recalculateReviewStats(product);
    await product.save();
    await product.populate('reviews.user', 'name');

    await createNotification({
      userId: product.seller,
      actorId: req.user._id,
      productId: product._id,
      type: existingReview ? 'review_updated' : 'new_review',
      title: existingReview ? 'A review was updated' : 'New review received',
      message: `${req.user.name} rated "${product.title}" ${numericRating}/5${comment.trim() ? ' and left feedback.' : '.'}`,
      link: `/products/${product._id}`,
      metadata: {
        rating: numericRating,
        reviewCount: product.reviewCount,
      },
    });

    return res.json({
      message: existingReview ? 'Review updated successfully' : 'Review added successfully',
      reviews: product.reviews,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const reportProduct = async (req, res) => {
  try {
    const { targetType, reason, details = '' } = req.body;
    const Report = require('../../../models/Report');

    if (!['product', 'user'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid report target' });
    }

    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Please provide a reason for the report' });
    }

    const product = await Product.findById(req.params.id).populate('seller', '_id name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

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

    const { createNotifications } = require('../../shared/utils/notification.utils');
    await createNotifications(
      admins.map((admin) => admin._id),
      {
        actorId: req.user._id,
        productId: product._id,
        reportId: report._id,
        type: 'new_report',
        title: 'New report submitted',
        message: `${req.user.name} reported ${targetType === 'product' ? `"${product.title}"` : product.seller.name}.`,
        link: '/admin/reports',
        metadata: {
          targetType,
          reason: reason.trim(),
        },
      }
    );

    return res.status(201).json({
      message: targetType === 'product'
        ? 'Product report submitted successfully'
        : 'User report submitted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  const tempFilePaths = (req.files || []).map((file) => file.path).filter(Boolean);

  try {
    const { title, description, category, condition, price, location, contactInfo } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one image' });
    }

    const validCategory = await ensureValidCategory(category);
    if (!validCategory) {
      return res.status(400).json({ message: 'Please choose a valid active category' });
    }

    const uploadedImages = await uploadImages(req.files);

    const productData = {
      title,
      description,
      category,
      condition,
      price,
      location,
      contactInfo: parseContactInfo(contactInfo),
      images: uploadedImages,
      seller: req.user._id,
    };

    const product = new Product(productData);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'name phone location');

    return res.status(201).json(populatedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: error.message });
  } finally {
    cleanupTempFiles(tempFilePaths);
  }
};

const updateProduct = async (req, res) => {
  const tempFilePaths = (req.files || []).map((file) => file.path).filter(Boolean);

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const previousPrice = product.price;
    const previousIsActive = product.isActive;
    const previousIsSold = product.isSold;

    let uploadedImages = [];
    if (req.files?.length) {
      uploadedImages = await uploadImages(req.files);
    }

    let existingImages = req.body.existingImages || [];
    if (!Array.isArray(existingImages)) {
      existingImages = existingImages ? [existingImages] : [];
    }

    const validCategory = await ensureValidCategory(req.body.category);
    if (!validCategory) {
      return res.status(400).json({ message: 'Please choose a valid active category' });
    }

    const contactInfo = parseContactInfo(req.body.contactInfo);
    const nextImages = [...existingImages, ...uploadedImages];

    if (nextImages.length === 0) {
      return res.status(400).json({ message: 'Please keep at least one image' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        contactInfo,
        images: nextImages,
      },
      { new: true, runValidators: true }
    ).populate('seller', 'name phone location');

    const nextPrice = Number(updatedProduct.price);

    if (Number.isFinite(nextPrice) && Number(previousPrice) !== nextPrice) {
      const priceDirection = nextPrice < Number(previousPrice) ? 'dropped' : 'changed';
      await notifyWishlistUsers({
        productId: updatedProduct._id,
        actorId: req.user._id,
        type: 'wishlist_price_update',
        title: nextPrice < Number(previousPrice) ? 'Price dropped on a saved item' : 'Price changed on a saved item',
        message: `"${updatedProduct.title}" ${priceDirection} from Rs.${Number(previousPrice)} to Rs.${nextPrice}.`,
        link: `/products/${updatedProduct._id}`,
        metadata: { previousPrice: Number(previousPrice), nextPrice },
        excludeUserIds: [req.user._id],
      });
    }

    if (previousIsActive !== updatedProduct.isActive || previousIsSold !== updatedProduct.isSold) {
      let title = 'Saved listing updated';
      let message = `"${updatedProduct.title}" was updated.`;
      let type = 'wishlist_listing_update';

      if (updatedProduct.isSold) {
        title = 'Saved item was marked sold';
        message = `"${updatedProduct.title}" is no longer available because it was marked sold.`;
        type = 'wishlist_item_sold';
      } else if (updatedProduct.isActive === false) {
        title = 'Saved item became unavailable';
        message = `"${updatedProduct.title}" is currently unavailable.`;
        type = 'wishlist_item_unavailable';
      } else if (updatedProduct.isActive && !updatedProduct.isSold) {
        title = 'Saved item is available again';
        message = `"${updatedProduct.title}" is active again.`;
        type = 'wishlist_item_available';
      }

      await notifyWishlistUsers({
        productId: updatedProduct._id,
        actorId: req.user._id,
        type,
        title,
        message,
        link: `/products/${updatedProduct._id}`,
        metadata: { isActive: updatedProduct.isActive, isSold: updatedProduct.isSold },
        excludeUserIds: [req.user._id],
      });
    }

    return res.json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  } finally {
    cleanupTempFiles(tempFilePaths);
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const previousIsActive = product.isActive;
    const previousIsSold = product.isSold;

    if (req.body.isActive !== undefined) {
      product.isActive = req.body.isActive;
    }
    
    if (req.body.isSold !== undefined) {
      product.isSold = req.body.isSold;
    }

    await product.save();

    if (previousIsActive !== product.isActive || previousIsSold !== product.isSold) {
      let title = 'Saved listing updated';
      let message = `"${product.title}" was updated.`;
      let type = 'wishlist_listing_update';

      if (product.isSold) {
        title = 'Saved item was marked sold';
        message = `"${product.title}" is no longer available because it was marked sold.`;
        type = 'wishlist_item_sold';
      } else if (product.isActive === false) {
        title = 'Saved item became unavailable';
        message = `"${product.title}" is currently unavailable.`;
        type = 'wishlist_item_unavailable';
      } else if (product.isActive && !product.isSold) {
        title = 'Saved item is available again';
        message = `"${product.title}" is active again.`;
        type = 'wishlist_item_available';
      }

      await notifyWishlistUsers({
        productId: product._id,
        actorId: req.user._id,
        type,
        title,
        message,
        link: `/products/${product._id}`,
        metadata: { isActive: product.isActive, isSold: product.isSold },
        excludeUserIds: [req.user._id],
      });
    }

    const populatedProduct = await Product.findById(product._id).populate('seller', 'name phone location');
    return res.json(populatedProduct);
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

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await notifyWishlistUsers({
      productId: product._id,
      actorId: req.user._id,
      type: 'wishlist_item_removed',
      title: 'Saved item was removed',
      message: `"${product.title}" is no longer available because the listing was removed.`,
      link: '/wishlist',
      metadata: { removed: true },
      excludeUserIds: [req.user._id],
    });

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
  addReview,
  reportProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
};
