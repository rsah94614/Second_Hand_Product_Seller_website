const Category = require('../../../../models/Category');
const Product = require('../../../../models/Product');
const { ensureDefaultCategories } = require('../../../../utils/categoryDefaults');

const getCategories = async (req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .select('-__v')
      .lean();

    const countMap = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countsByCategory = countMap.reduce((acc, entry) => {
      acc[entry._id] = entry.count;
      return acc;
    }, {});

    const rows = categories.map((category) => ({
      ...category,
      productCount: countsByCategory[category.name] || 0,
    }));

    return res.json({ categories: rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getCategories };
