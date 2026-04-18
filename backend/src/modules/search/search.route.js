const express = require('express');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const SearchHistory = require('../../../models/SearchHistory');
const auth = require('../../shared/middleware/auth.middleware');

const router = express.Router();

// ─── Search History (Phase 3 - Task 3.5.1) ───────────────────────────────────

router.get('/history', auth, async (req, res) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('query createdAt resultsCount')
      .lean();
    return res.json({ history });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/history', auth, async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    return res.json({ message: 'Search history cleared' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ─── Search Suggestions (Phase 3 - Task 3.5.2) ───────────────────────────────

router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      const recent = await SearchHistory.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('query')
        .lean();
      return res.json({ suggestions: recent.map((r) => ({ query: r.query, type: 'recent' })) });
    }

    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');

    const [popular, recent, products] = await Promise.all([
      SearchHistory.aggregate([
        { $match: { query: { $regex: escaped, $options: 'i' } } },
        { $group: { _id: '$query', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      SearchHistory.find({ user: req.user._id, query: { $regex: searchRegex } })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('query')
        .lean(),
      Product.find({ title: { $regex: searchRegex }, isActive: true, isSold: false })
        .select('title category')
        .limit(5)
        .lean(),
    ]);

    const seen = new Set();
    const suggestions = [];

    recent.forEach((r) => {
      if (!seen.has(r.query)) { seen.add(r.query); suggestions.push({ query: r.query, type: 'recent' }); }
    });
    popular.forEach((p) => {
      if (!seen.has(p._id)) { seen.add(p._id); suggestions.push({ query: p._id, type: 'popular', count: p.count }); }
    });
    products.forEach((p) => {
      if (!seen.has(p.title)) { seen.add(p.title); suggestions.push({ query: p.title, type: 'product', category: p.category }); }
    });

    return res.json({ suggestions: suggestions.slice(0, 10) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ─── Main Search (Tasks 2.6.1, 2.6.2 + Phase 4 text index) ──────────────────

router.get('/', async (req, res) => {
  try {
    const { q, limit = 20, sort = 'relevance', order = 'desc', cursor } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ products: [], users: [], nextCursor: null, hasMore: false, total: 0 });
    }

    const cap = Math.min(parseInt(limit, 10) || 20, 100);
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');

    // Phase 4: use MongoDB $text index for relevance (faster than regex)
    let productQuery;
    const sortOptions = {};

    if (sort === 'relevance') {
      productQuery = { $text: { $search: q.trim() }, isActive: true, isSold: false };
      sortOptions.score = { $meta: 'textScore' };
    } else {
      productQuery = {
        $or: [{ title: searchRegex }, { description: searchRegex }, { category: searchRegex }],
        isActive: true,
        isSold: false,
      };
      if (cursor) productQuery._id = { $lt: cursor };

      switch (sort) {
        case 'price': sortOptions.price = order === 'asc' ? 1 : -1; break;
        case 'date': sortOptions.createdAt = order === 'asc' ? 1 : -1; break;
        case 'rating': sortOptions.averageRating = order === 'asc' ? 1 : -1; break;
        default: sortOptions.createdAt = -1;
      }
      sortOptions._id = -1;
    }

    const [products, users] = await Promise.all([
      Product.find(productQuery)
        .select('title images category location price averageRating reviewCount createdAt')
        .populate('seller', 'name location')
        .sort(sortOptions)
        .limit(cap + 1)
        .lean(),
      User.find({ $or: [{ name: searchRegex }, { email: searchRegex }], role: 'user', isActive: true })
        .select('name email avatar campus.collegeName')
        .limit(Math.min(cap, 10))
        .lean(),
    ]);

    const hasMore = products.length > cap;
    const productResults = hasMore ? products.slice(0, cap) : products;
    const nextCursor = hasMore && productResults.length > 0
      ? productResults[productResults.length - 1]._id.toString()
      : null;

    let total = 0;
    if (!cursor) total = await Product.countDocuments(productQuery);

    // Log search history (fire-and-forget, first page only)
    if (!cursor) {
      const userId = req.user?._id || null;
      SearchHistory.create({ user: userId, query: q.trim(), resultsCount: total }).catch(() => {});
    }

    return res.json({ products: productResults, users, nextCursor, hasMore, total, sort, order });
  } catch (error) {
    return res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
