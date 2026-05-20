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
const { buildSearchClause, rankByRelevance } = require('../../shared/utils/searchUtils');

// const escapeRegex = (text = '') => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch{
      console.warn('[ProductService] Failed to parse contactInfo JSON:', value);
      return {};
    }
  }
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
  const baseQuery = { isActive: true, isSold: false, expiresAt: { $gte: new Date() } };

  if (category) baseQuery.category = category;
  const hasMinPrice = minPrice !== undefined && minPrice !== null && minPrice !== '';
  const hasMaxPrice = maxPrice !== undefined && maxPrice !== null && maxPrice !== '';
  if (hasMinPrice || hasMaxPrice) {
    baseQuery.price = {};
    if (hasMinPrice) baseQuery.price.$gte = Number(minPrice);
    if (hasMaxPrice) baseQuery.price.$lte = Number(maxPrice);
  }

  const numericLimit = Number(limit);
  
  // Parse cursor as page (default 1). Fallback gracefully if client sends an old ObjectId cursor.
  const isOldCursor = cursor && isValidObjectId(cursor);
  const page = (cursor && !isOldCursor) ? Number(cursor) : 1;
  const skipCount = (page - 1) * numericLimit;

  const isSearching = search && search.trim().length > 0;
  const isDefaultSort = !sortBy || sortBy === 'createdAt';

  let products = [];
  let total = 0;

  if (isSearching) {
    // ── Smart search path ──────────────────────────────────────────────
    const searchClause = buildSearchClause(search);
    const searchQuery = { ...baseQuery, ...searchClause };

    const poolSort = isDefaultSort
      ? { createdAt: -1 }
      : { [allowedSortFields.has(sortBy) ? sortBy : 'createdAt']: sortOrder === 'desc' ? -1 : 1 };

    // Fetch up to 200 items for re-ranking pool
    const pool = await Product.find(searchQuery)
      .populate('seller', 'name location')
      .sort(poolSort)
      .limit(200)
      .lean();

    total = await Product.countDocuments(searchQuery);
    if (total > 200) total = 200; // Cap total since we only paginate up to 200

    // Re-rank by relevance if default sort, otherwise keep DB sort
    const ranked = isDefaultSort ? rankByRelevance(pool, search) : pool;

    // Paginate in memory
    products = ranked.slice(skipCount, skipCount + numericLimit);
  } else {
    // ── Standard browse path (no search term) ─────────────────────────
    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
    const sortOptions = { [safeSortBy]: sortOrder === 'desc' ? -1 : 1 };
    if (safeSortBy !== '_id') sortOptions['_id'] = sortOrder === 'desc' ? -1 : 1;

    products = await Product.find(baseQuery)
      .populate('seller', 'name location')
      .sort(sortOptions)
      .skip(skipCount)
      .limit(numericLimit);

    total = await Product.countDocuments(baseQuery);
  }

  const nextCursor = products.length === numericLimit ? (page + 1).toString() : null;

  return { products, nextCursor, total };
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
    .populate('seller', 'name location')
    .sort({ averageRating: -1, views: -1, createdAt: -1 })
    .limit(15);

  if (relatedProducts.length < 15) {
    const seenIds = relatedProducts.map((item) => item._id);
    seenIds.push(product._id);

    const fallbackProducts = await Product.find({
      _id: { $nin: seenIds },
      isActive: true,
      isSold: false,
      category: product.category,
    })
      .populate('seller', 'name location')
      .sort({ views: -1, averageRating: -1, createdAt: -1 })
      .limit(15 - relatedProducts.length);

    relatedProducts = [...relatedProducts, ...fallbackProducts];
  }

  return { products: relatedProducts };
};

const LISTING_EXPIRY_DAYS = 60;

const getBearerToken = (headerValue) => {
  if (!headerValue || typeof headerValue !== 'string') return null;
  return headerValue.replace(/Bearer\s+/i, '').trim() || null;
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
  LISTING_EXPIRY_DAYS,
  getBearerToken,
};
