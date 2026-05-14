const User = require('../../../models/User');
const Product = require('../../../models/Product');
const SearchHistory = require('../../../models/SearchHistory');
const { buildSearchClause, rankByRelevance } = require('../../shared/utils/searchUtils');

// ─── Search History (Phase 3 - Task 3.5.1) ───────────────────────────────────

exports.getHistory = async (req, res) => {
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
};

exports.clearHistory = async (req, res) => {
    try {
        await SearchHistory.deleteMany({ user: req.user._id });
        return res.json({ message: 'Search history cleared' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// ─── Search Suggestions (Phase 3 - Task 3.5.2) ───────────────────────────────

exports.getSuggestions = async (req, res) => {
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
};

// ─── Main Search ─────────────────────────────────────────────────────────────

exports.search = async (req, res) => {
    try {
        const { q, limit = 20, sort = 'relevance', order = 'desc', cursor } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({ products: [], users: [], nextCursor: null, hasMore: false, total: 0 });
        }

        const cap = Math.min(parseInt(limit, 10) || 20, 100);
        const trimmedQ = q.trim();

        // Build a rich search clause with synonyms + typo tolerance
        const searchClause = buildSearchClause(trimmedQ);
        const baseProductQuery = { isActive: true, isSold: false };

        let productQuery;
        const sortOptions = {};
        const isRelevanceSort = sort === 'relevance';

        if (isRelevanceSort) {
            // For relevance: fetch a larger pool and re-rank in JS
            productQuery = { ...baseProductQuery, ...searchClause };
            sortOptions.createdAt = -1; // DB sort for the pool
        } else {
            productQuery = { ...baseProductQuery, ...searchClause };
            if (cursor) productQuery._id = { $lt: cursor };

            switch (sort) {
                case 'price':  sortOptions.price         = order === 'asc' ? 1 : -1; break;
                case 'date':   sortOptions.createdAt     = order === 'asc' ? 1 : -1; break;
                case 'rating': sortOptions.averageRating = order === 'asc' ? 1 : -1; break;
                default:       sortOptions.createdAt     = -1;
            }
            sortOptions._id = -1;
        }

        // Build user search — also expand synonyms for name matching
        const escaped = trimmedQ.replace(/[.*+?^${}()|[\]\]\\]/g, '\\$&');
        const nameRegex = new RegExp(escaped, 'i');

        // Fetch a pool for re-ranking (4× cap for relevance sort, cap+1 otherwise)
        const poolSize = isRelevanceSort ? Math.min(cap * 4, 200) : cap + 1;

        const [rawProducts, users] = await Promise.all([
            Product.find(productQuery)
                .select('title images category location price averageRating reviewCount views description createdAt')
                .populate('seller', 'name location')
                .sort(sortOptions)
                .limit(poolSize)
                .lean(),
            User.find({ $or: [{ name: nameRegex }, { email: trimmedQ.toLowerCase() }], role: 'user', isActive: true })
                .select('name email avatar campus.department')
                .limit(Math.min(cap, 10))
                .lean(),
        ]);

        let productResults;
        let hasMore;
        let nextCursor;

        if (isRelevanceSort) {
            // Re-rank by relevance score
            const ranked = rankByRelevance(rawProducts, trimmedQ);
            productResults = ranked.slice(0, cap);
            hasMore = ranked.length > cap;
            nextCursor = null; // cursor-based pagination not used with re-ranking
        } else {
            hasMore = rawProducts.length > cap;
            productResults = hasMore ? rawProducts.slice(0, cap) : rawProducts;
            nextCursor = hasMore && productResults.length > 0
                ? productResults[productResults.length - 1]._id.toString()
                : null;
        }

        let total = 0;
        if (!cursor) total = await Product.countDocuments(productQuery);

        // Save search history
        if (!cursor) {
            const userId = req.user?._id || null;
            if (userId) {
                SearchHistory.create({ user: userId, query: trimmedQ, resultsCount: total }).catch(() => {});
            }
        }

        return res.json({ products: productResults, users, nextCursor, hasMore, total, sort, order });
    } catch (error) {
        return res.status(500).json({ message: 'Search failed' });
    }
};
