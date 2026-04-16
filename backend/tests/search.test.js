const assert = require('node:assert/strict');
const request = require('supertest');
const User = require('../models/User');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');
const { createProduct } = require('./helpers/products');

const runSearchTests = async (app) => {
  await clearDatabase();

  const seller = await registerAndLogin(app, {
    email: 'search-seller@example.com',
    name: 'Search Seller',
  });

  const activeProduct = await createProduct({
    seller: seller.user.id,
    title: 'Vintage Lamp',
    description: 'An antique lamp with warm light',
    category: 'Home Decor',
    location: 'Delhi',
  });

  await createProduct({
    seller: seller.user.id,
    title: 'Old Book',
    description: 'Rare first edition novel',
    category: 'Books',
    location: 'Mumbai',
    isSold: true,
    isActive: false,
  });

  const activeUser = await registerAndLogin(app, {
    email: 'search-active@example.com',
    name: 'Active Searcher',
  });

  const inactiveUser = await registerAndLogin(app, {
    email: 'search-inactive@example.com',
    name: 'Inactive Searcher',
  });
  await User.findByIdAndUpdate(inactiveUser.user.id, { isActive: false });

  const productResponse = await request(app)
    .get('/api/search')
    .query({ q: 'Lamp', limit: 5 });

  assert.equal(productResponse.statusCode, 200);
  assert.equal(productResponse.body.products.length, 1);
  assert.equal(productResponse.body.products[0]._id, activeProduct._id.toString());

  const userResponse = await request(app)
    .get('/api/search')
    .query({ q: 'Search', limit: 5 });

  assert.equal(userResponse.statusCode, 200);
  assert.ok(userResponse.body.users.some((user) => user.email === activeUser.payload.email));
  assert.ok(!userResponse.body.users.some((user) => user.email === inactiveUser.payload.email));

  const shortQueryResponse = await request(app)
    .get('/api/search')
    .query({ q: 'a', limit: 5 });

  assert.equal(shortQueryResponse.statusCode, 200);
  assert.deepEqual(shortQueryResponse.body, { products: [], users: [] });
};

module.exports = {
  runSearchTests,
};
