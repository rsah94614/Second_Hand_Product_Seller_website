const mongoose = require('mongoose');
const Product = require('../../../models/Product');
const Category = require('../../../models/Category');
const User = require('../../../models/User');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const { ensureDefaultCategories } = require('../../../utils/categoryDefaults');
const {
  createNotifications,
} = require('../../shared/utils/notification.utils');

const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const allowedSortFields = new Set(['createdAt', 'price', 'title', 'views', 'averageRating', 'reviewCount']);

const normalizeText = (value = '') => value.toString().trim().toLowerCase();

const scoreSearchMatch = (product, search) => {
  const query = normalizeText(search);
  if (!query) return 0;

  const title = normalizeText(product.title);
  const description = normalizeText(product.description);
  const category = normalizeText(product.category);
  const terms = query.split(/\s+/).filter(Boolean);

  let score = 0;

  if (title === query) score += 120;
  if (title.startsWith(query)) score += 70;
  if (title.includes(query)) score += 45;
  if (category.includes(query)) score += 32;
  if (description.includes(query)) score += 12;

  terms.forEach((term) => {
    if (title.includes(term)) score += 16;
    if (category.includes(term)) score += 10;
    if (description.includes(term)) score += 4;
  });

  score += Math.min(product.views || 0, 40) * 0.18;
  score += Math.min(product.averageRating || 0, 5) * 3;
  score += Math.min(product.reviewCount || 0, 10) * 0.8;

  return score;
};

const recalculateReviewStats = (product) => {
  const reviewCount = product.reviews?.length || 0;
  const averageRating = reviewCount
    ? Number((product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1))
    : 0;

  product.reviewCount = reviewCount;
  product.averageRating = averageRating;
};

const parseContactInfo = (value) => {
  if (!value) return {};
  if (typeof value === 'string') return JSON.parse(value);
  return value;
};

const ensureValidCategory = async (category) => {
  await ensureDefaultCategories();
  return Category.findOne({ name: category, isActive: true });
};

const uploadImages = async (files) => {
  const uploadedImages = [];
  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'campusmitra-products',
    });
    uploadedImages.push(result.secure_url);
  }
  return uploadedImages;
};

const cleanupTempFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

const notifyWishlistUsers = async ({
  productId,
  actorId = null,
  type,
  title,
  message,
  link,
  metadata = {},
  excludeUserIds = [],
}) => {
  const excluded = new Set(excludeUserIds.filter(Boolean).map((userId) => userId.toString()));
  const users = await User.find({ wishlist: productId }).select('_id');
  const userIds = users
    .map((user) => user._id.toString())
    .filter((userId) => !excluded.has(userId));

  return createNotifications(userIds, {
    actorId,
    productId,
    type,
    title,
    message,
    link,
    metadata,
  });
};

const findProducts = async ({ cursor, limit = 12, category, minPrice, maxPrice, search, sortBy = 'createdAt', sortOrder = 'desc' }) => {
  const query = { isActive: true, isSold: false };

  if (cursor) {
    if (!isValidObjectId(cursor)) {
      throw new Error('Invalid cursor');
    }
    query._id = { $lt: cursor };
  }

  if (category) query.category = category;
  const hasMinPrice = minPrice !== undefined && minPrice !== null && minPrice !== '';
  const hasMaxPrice = maxPrice !== undefined && maxPrice !== null && maxPrice !== '';
  if (hasMinPrice || hasMaxPrice) {
    query.price = {};
    if (hasMinPrice) query.price.$gte = Number(minPrice);
    if (hasMaxPrice) query.price.$lte = Number(maxPrice);
  }
  if (search) {
    const escapedSearch = escapeRegex(search);
    query.$or = [
      { title: new RegExp(escapedSearch, 'i') },
      { description: new RegExp(escapedSearch, 'i') },
    ];
  }

  const numericLimit = Number(limit);
  const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
  const sortOptions = {};
  sortOptions[safeSortBy] = sortOrder === 'desc' ? -1 : 1;
  if (safeSortBy !== '_id') {
    sortOptions['_id'] = sortOrder === 'desc' ? -1 : 1;
  }

  let products = [];
  let total = 0;

  if (search && (!sortBy || sortBy === 'createdAt')) {
    const matchedProducts = await Product.find(query).populate('seller', 'name phone location');

    const rankedProducts = matchedProducts
      .map((product) => ({
        product,
        relevanceScore: scoreSearchMatch(product, search),
      }))
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
        return new Date(b.product.createdAt) - new Date(a.product.createdAt);
      });

    total = rankedProducts.length;
    products = rankedProducts
      .slice(0, numericLimit)
      .map((entry) => entry.product);
  } else {
    products = await Product.find(query)
      .populate('seller', 'name phone location')
      .sort(sortOptions)
      .limit(numericLimit);

    total = await Product.countDocuments(query);
  }

  const nextCursor = products.length === numericLimit ? products[products.length - 1]._id.toString() : null;

  return {
    products,
    nextCursor,
    total,
  };
};

const findRelatedProducts = async (productId) => {
  const product = await Product.findById(productId).select('category price seller');
  if (!product) return null;

  const minPrice = Math.max(0, Number(product.price || 0) * 0.6);
  const maxPrice = Number(product.price || 0) * 1.4 || Number(product.price || 0) + 1000;

  let relatedProducts = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    isSold: false,
    category: product.category,
    price: { $gte: minPrice, $lte: maxPrice },
  })
    .populate('seller', 'name phone location')
    .sort({ averageRating: -1, views: -1, createdAt: -1 })
    .limit(8);

  if (relatedProducts.length < 8) {
    const seenIds = relatedProducts.map((item) => item._id);
    seenIds.push(product._id);

    const fallbackProducts = await Product.find({
      _id: { $nin: seenIds },
      isActive: true,
      isSold: false,
      category: product.category,
    })
      .populate('seller', 'name phone location')
      .sort({ views: -1, averageRating: -1, createdAt: -1 })
      .limit(8 - relatedProducts.length);

    relatedProducts = [...relatedProducts, ...fallbackProducts];
  }

  return { products: relatedProducts };
};

module.exports = {
  scoreSearchMatch,
  recalculateReviewStats,
  parseContactInfo,
  ensureValidCategory,
  uploadImages,
  cleanupTempFiles,
  notifyWishlistUsers,
  findProducts,
  findRelatedProducts,
};
