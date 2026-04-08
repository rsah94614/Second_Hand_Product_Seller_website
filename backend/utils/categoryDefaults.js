const Category = require('../models/Category');
const Product = require('../models/Product');

const DEFAULT_PRODUCT_CATEGORIES = [
  {
    name: 'Electronics',
    description: 'Phones, laptops, gadgets, and everyday electronics.',
    sortOrder: 1,
  },
  {
    name: 'Books & Study Materials',
    description: 'Textbooks, class notes, exam prep guides, and academic reading.',
    sortOrder: 2,
  },
  {
    name: 'Fashion & Clothing',
    description: 'Clothing, footwear, watches, and student-friendly accessories.',
    sortOrder: 3,
  },
  {
    name: 'Hostel Essentials',
    description: 'Daily-use dorm and hostel items, storage, and practical room supplies.',
    sortOrder: 4,
  },
  {
    name: 'Furniture & Decor',
    description: 'Study tables, chairs, lamps, organisers, and room decor.',
    sortOrder: 5,
  },
  {
    name: 'Sports & Fitness',
    description: 'Sports gear, gym equipment, and fitness essentials for campus life.',
    sortOrder: 6,
  },
  {
    name: 'Bags & Accessories',
    description: 'Backpacks, laptop bags, wallets, and everyday carry accessories.',
    sortOrder: 7,
  },
  {
    name: 'Cycles',
    description: 'Bicycles, locks, helmets, and campus commuting gear.',
    sortOrder: 8,
  },
  {
    name: 'Academic Tools',
    description: 'Calculators, lab tools, project kits, and academic instruments.',
    sortOrder: 9,
  },
  {
    name: 'Other',
    description: 'Everything else that does not fit the main campus-focused groups.',
    sortOrder: 10,
  },
];

const LEGACY_CATEGORY_RENAMES = {
  Books: 'Books & Study Materials',
  Fashion: 'Fashion & Clothing',
  'Home & Garden': 'Furniture & Decor',
  Sports: 'Sports & Fitness',
  Vehicles: 'Cycles',
  'Real Estate': 'Hostel Essentials',
  Services: 'Other',
  'Student Services': 'Other',
};

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const ensureDefaultCategories = async () => {
  const desiredCategoryNames = new Set(DEFAULT_PRODUCT_CATEGORIES.map((category) => category.name));

  const operations = DEFAULT_PRODUCT_CATEGORIES.map((category) => ({
    updateOne: {
      filter: { name: category.name },
      update: {
        $set: {
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

  for (const [legacyName, nextName] of Object.entries(LEGACY_CATEGORY_RENAMES)) {
    await Product.updateMany(
      { category: legacyName },
      { $set: { category: nextName } }
    );

    await Category.deleteMany({ name: legacyName });
  }

  await Category.deleteMany({
    name: { $nin: [...desiredCategoryNames] },
  });
};

module.exports = {
  DEFAULT_PRODUCT_CATEGORIES,
  LEGACY_CATEGORY_RENAMES,
  ensureDefaultCategories,
  slugify,
};
