const express = require('express');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const auth = require('../../shared/middleware/auth.middleware');

const router = express.Router();

const buildWishlistPayload = (user) => ({
  wishlist: (user.wishlist || []).map((item) => item.toString()),
  wishlistCount: user.wishlist?.length || 0,
});

router.get('/me/wishlist', auth, async (req, res) => {
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
});

router.get('/me/recently-viewed', auth, async (req, res) => {
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
});

router.post('/me/wishlist/:productId', auth, async (req, res) => {
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
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

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
});

router.put('/:id', auth, async (req, res) => {
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

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true }
    ).select('-password');

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
