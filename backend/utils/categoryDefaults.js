const Category = require('../models/Category');

const DEFAULT_PRODUCT_CATEGORIES = [
  {
    name: 'Electronics',
    description: 'Phones, laptops, gadgets, and everyday electronics.',
    sortOrder: 1,
  },
  {
    name: 'Fashion',
    description: 'Clothing, footwear, watches, and accessories.',
    sortOrder: 2,
  },
  {
    name: 'Home & Garden',
    description: 'Furniture, decor, kitchen essentials, and home care items.',
    sortOrder: 3,
  },
  {
    name: 'Sports',
    description: 'Fitness gear, sports equipment, and outdoor essentials.',
    sortOrder: 4,
  },
  {
    name: 'Books',
    description: 'Academic books, novels, and study materials.',
    sortOrder: 5,
  },
  {
    name: 'Vehicles',
    description: 'Cars, bikes, scooters, and vehicle accessories.',
    sortOrder: 6,
  },
  {
    name: 'Real Estate',
    description: 'Hostel spaces, rooms, flats, and accommodation listings.',
    sortOrder: 7,
  },
  {
    name: 'Services',
    description: 'Freelance, tutoring, repair, and other service offerings.',
    sortOrder: 8,
  },
  {
    name: 'Other',
    description: 'Everything else that does not fit the main groups.',
    sortOrder: 9,
  },
];

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const ensureDefaultCategories = async () => {
  const operations = DEFAULT_PRODUCT_CATEGORIES.map((category) => ({
    updateOne: {
      filter: { name: category.name },
      update: {
        $setOnInsert: {
          ...category,
          slug: slugify(category.name),
          isActive: true,
          icon: '',
          image: '',
          parent: null,
          subcategories: [],
        },
      },
      upsert: true,
    },
  }));

  if (operations.length) {
    await Category.bulkWrite(operations, { ordered: false });
  }
};

module.exports = {
  DEFAULT_PRODUCT_CATEGORIES,
  ensureDefaultCategories,
  slugify,
};
