const Category = require('../../../models/Category');
const Product = require('../../../models/Product');
const { ensureDefaultCategories } = require('../../../utils/categoryDefaults');
const { sanitizeCategoryPayload } = require('./category.service');

const getCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v');

    return res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Server error while fetching categories' });
  }
};

const getAdminCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v')
      .lean();

    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = categoryCounts.reduce((acc, entry) => {
      acc[entry._id] = entry.count;
      return acc;
    }, {});

    const categoriesWithCounts = categories.map((category) => ({
      ...category,
      productCount: countMap[category.name] || 0,
    }));

    return res.json({ categories: categoriesWithCounts });
  } catch (error) {
    console.error('Admin get categories error:', error);
    return res.status(500).json({ message: 'Server error while fetching categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { data, error } = sanitizeCategoryPayload(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const existing = await Category.findOne({
      name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = await Category.create(data);

    return res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Server error while creating category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const existingCategory = await Category.findById(req.params.id);

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const mergedPayload = {
      ...existingCategory.toObject(),
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : existingCategory.isActive,
    };
    const { data, error } = sanitizeCategoryPayload(mergedPayload);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: existingCategory._id },
      name: { $regex: `^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    if (existingCategory.name !== data.name) {
      await Product.updateMany({ category: existingCategory.name }, { $set: { category: data.name } });
    }

    Object.assign(existingCategory, data);
    await existingCategory.save();

    return res.json({
      message: 'Category updated successfully',
      category: existingCategory,
    });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ message: 'Server error while updating category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: category.name });

    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It has ${productCount} products associated with it.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ message: 'Server error while deleting category' });
  }
};

module.exports = {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

// ─── Category Analytics (Phase 3 - Task 3.6.2) ───────────────────────────────

const Order = require('../../../models/Order');

const getCategoryAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    // Current period: last 30 days
    const [currentStats, previousStats, orderStats, viewStats] = await Promise.all([
      // Listings created in last 30 days per category
      Product.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$category', newListings: { $sum: 1 } } },
      ]),

      // Listings created in previous 30 days (30-60 days ago) for trend comparison
      Product.aggregate([
        { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: '$category', newListings: { $sum: 1 } } },
      ]),

      // Orders per category in last 30 days
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.category', orders: { $sum: 1 } } },
      ]),

      // Total views per category (all time)
      Product.aggregate([
        { $group: { _id: '$category', totalViews: { $sum: '$views' }, totalListings: { $sum: 1 }, activeListings: { $sum: { $cond: ['$isActive', 1, 0] } } } },
      ]),
    ]);

    // Build lookup maps
    const currentMap = currentStats.reduce((acc, s) => { acc[s._id] = s.newListings; return acc; }, {});
    const previousMap = previousStats.reduce((acc, s) => { acc[s._id] = s.newListings; return acc; }, {});
    const orderMap = orderStats.reduce((acc, s) => { acc[s._id] = s.orders; return acc; }, {});

    // Merge all into per-category analytics
    const analytics = viewStats.map((s) => {
      const category = s._id;
      const newListings = currentMap[category] || 0;
      const prevListings = previousMap[category] || 0;

      // Trend: percentage change vs previous period
      let trend = 0;
      if (prevListings > 0) {
        trend = Math.round(((newListings - prevListings) / prevListings) * 100);
      } else if (newListings > 0) {
        trend = 100; // New activity where there was none
      }

      return {
        category,
        totalListings: s.totalListings,
        activeListings: s.activeListings,
        totalViews: s.totalViews,
        newListings30d: newListings,
        orders30d: orderMap[category] || 0,
        trend, // % change in new listings vs previous 30 days
        trendLabel: trend > 10 ? 'rising' : trend < -10 ? 'falling' : 'stable',
      };
    });

    // Sort by total views descending (most popular first)
    analytics.sort((a, b) => b.totalViews - a.totalViews);

    return res.json({
      analytics,
      period: '30d',
      generatedAt: now,
    });
  } catch (error) {
    console.error('Category analytics error:', error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryAnalytics,
};
