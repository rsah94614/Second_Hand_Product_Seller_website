const Product = require('../../models/Product');

const createProduct = async (overrides = {}) => {
  return Product.create({
    title: 'Test Laptop',
    description: 'A reliable product used for automated test scenarios.',
    price: 25000,
    category: 'Electronics',
    condition: 'Good',
    location: 'Kolkata',
    images: ['https://example.com/product.jpg'],
    seller: overrides.seller,
    contactInfo: {
      phone: '9999999999',
      email: 'seller@example.com',
    },
    ...overrides,
  });
};

module.exports = {
  createProduct,
};
