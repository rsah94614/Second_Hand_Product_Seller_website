const User = require('../../../models/User');
const Product = require('../../../models/Product');
const { buildWishlistPayload } = require('./user.service');
const {
  createNotification,
} = require('../../shared/utils/notification.utils');

const recalculateSellerReviewStats = (user) => {
  const reviewCount = user.reviews?.length || 0;
  const averageRating = reviewCount
    ? Number((user.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1))
    : 0;

  user.reviewCount = reviewCount;
  user.averageRating = averageRating;
};

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        populate: {
          path: 'seller',
          select: 'name location',
        },
      })
      .select('wishlist');

    return res.json({
      products: user?.wishlist || [],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'recentlyViewed.product',
        match: { isActive: true, isSold: false },
        populate: {
          path: 'seller',
          select: 'name location',
        },
      })
      .select('recentlyViewed');

    const products = (user?.recentlyViewed || [])
      .filter((entry) => entry.product)
      .map((entry) => ({
        ...entry.product.toObject(),
        viewedAt: entry.viewedAt,
      }));

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select('_id isActive isSold');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user._id).select('wishlist');
    const productId = product._id.toString();
    const currentWishlist = (user.wishlist || []).map((item) => item.toString());
    const exists = currentWishlist.includes(productId);

    user.wishlist = exists
      ? user.wishlist.filter((item) => item.toString() !== productId)
      : [...user.wishlist, product._id];

    await user.save();

    return res.json({
      message: exists ? 'Removed from wishlist' : 'Added to wishlist',
      added: !exists,
      ...buildWishlistPayload(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('reviews.user', 'name')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const products = await Product.find({ seller: req.params.id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      user,
      recentProducts: products,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addSellerReview = async (req, res) => {
  try {
    const { rating, comment = '', productId } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const seller = await User.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot review your own seller profile' });
    }

    const existingReview = seller.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment.trim();
    } else {
      seller.reviews.push({
        user: req.user._id,
        rating: numericRating,
        comment: comment.trim(),
      });
    }

    recalculateSellerReviewStats(seller);
    await seller.save();
    await seller.populate('reviews.user', 'name');

    await createNotification({
      userId: seller._id,
      actorId: req.user._id,
      productId: productId || undefined,
      type: existingReview ? 'review_updated' : 'new_review',
      title: existingReview ? 'A seller review was updated' : 'New seller review received',
      message: `${req.user.name} rated you ${numericRating}/5${comment.trim() ? ' and left feedback.' : '.'}`,
      link: productId ? `/products/${productId}` : '/profile',
      metadata: {
        rating: numericRating,
        reviewCount: seller.reviewCount,
      },
    });

    return res.json({
      message: existingReview ? 'Seller review updated successfully' : 'Seller review added successfully',
      reviews: seller.reviews,
      averageRating: seller.averageRating,
      reviewCount: seller.reviewCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      avatar: req.body.avatar,
    };

    if (req.body.campus) {
      allowedUpdates['campus.collegeName'] = req.body.campus.collegeName || '';
      allowedUpdates['campus.department'] = req.body.campus.department || '';
      allowedUpdates['campus.year'] = req.body.campus.year || '';
      allowedUpdates['campus.enrollmentId'] = req.body.campus.enrollmentId || '';
      allowedUpdates['campus.hostel'] = req.body.campus.hostel || '';
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true }
    ).select('-password');

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWishlist,
  getRecentlyViewed,
  toggleWishlist,
  getUserProfile,
  addSellerReview,
  updateUserProfile,
};
