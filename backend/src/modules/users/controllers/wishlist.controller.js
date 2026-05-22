const User = require('../../../../models/User');
const Product = require('../../../../models/Product');
const { buildWishlistPayload } = require('../user.service');
const { buildPublicListingFilter } = require('../../products/product.service');

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'wishlist', populate: { path: 'seller', select: 'name location' } })
      .select('wishlist');
    return res.json({ products: user?.wishlist || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'recentlyViewed.product',
        match: buildPublicListingFilter(),
        populate: { path: 'seller', select: 'name location' },
      })
      .select('recentlyViewed');

    const products = (user?.recentlyViewed || [])
      .filter((entry) => entry.product)
      .map((entry) => ({ ...entry.product.toObject(), viewedAt: entry.viewedAt }));

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select('_id isActive isSold');
    if (!product) return res.status(404).json({ message: 'Product not found' });

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

module.exports = {
  getWishlist,
  getRecentlyViewed,
  toggleWishlist,
};
