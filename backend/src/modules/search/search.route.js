const express = require('express');
const User = require('../../../models/User');
const Product = require('../../../models/Product');

const router = express.Router();

/**
 * GET /api/search?q=term&limit=5
 * Returns matching products and users for the global search bar.
 */
router.get('/', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ products: [], users: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const cap = Math.min(parseInt(limit, 10) || 5, 10);

    const [products, users] = await Promise.all([
      Product.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
        ],
        status: 'available',
      })
        .select('title images category location price')
        .limit(cap)
        .lean(),

      User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
        ],
        role: 'user',
        isActive: true,
      })
        .select('name email avatar campus.collegeName')
        .limit(cap)
        .lean(),
    ]);

    return res.json({ products, users });
  } catch (error) {
    console.error('Global search error:', error.message);
    return res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
