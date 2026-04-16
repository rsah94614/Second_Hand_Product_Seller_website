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
