const Product = require('../../../../models/Product');
const User = require('../../../../models/User');
const jwt = require('jsonwebtoken');
const {
  findProducts,
  findRelatedProducts,
  getBearerToken,
} = require('../product.service');

const listProducts = async (req, res) => {
  try {

    const result = await findProducts(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProductsByUser = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const products = await Product.find({ seller: req.params.userId })
      .populate('seller', 'name location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
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
      populate: { 
        path: 'reviews.user', 
        select: 'name'
      },
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
          await Product.updateOne(
            { _id: product._id },
            { $inc: { views: 1 }, $addToSet: { viewedBy: userId } }
          );
        }
        if (userId) {
          await User.findByIdAndUpdate(userId, { $pull: { recentlyViewed: { product: product._id } } });
          await User.findByIdAndUpdate(userId, {
            $push: { recentlyViewed: { $each: [{ product: product._id, viewedAt: new Date() }], $position: 0, $slice: 12 } },
          });
        }
      } catch (err) { /* ignore invalid token */ }
    }

    const daysRemaining = product.expiresAt 
      ? Math.ceil((new Date(product.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;

    const response = {
      ...product.toObject(),
      daysRemaining,
      isExpiringSoon,
      relistCount: product.relistCount || 0,
    };

    return res.json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listProducts,
  getProductsByUser,
  getRelatedProducts,
  getProduct,
};
