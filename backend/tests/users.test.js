const assert = require('node:assert/strict');
const request = require('supertest');
const User = require('../models/User');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');
const { createProduct } = require('./helpers/products');

const runUserFeatureTests = async (app) => {
  await clearDatabase();

  const seller = await registerAndLogin(app, {
    email: 'wishlist-seller@example.com',
    name: 'Wishlist Seller',
  });
  const buyer = await registerAndLogin(app, {
    email: 'wishlist-buyer@example.com',
    name: 'Wishlist Buyer',
  });
  const product = await createProduct({
    seller: seller.user.id,
    title: 'Wishlist Test Product',
  });

  const addWishlistResponse = await request(app)
    .post(`/api/users/me/wishlist/${product._id}`)
    .set('Authorization', `Bearer ${buyer.token}`);

  assert.equal(addWishlistResponse.statusCode, 200);
  assert.equal(addWishlistResponse.body.added, true);
  assert.equal(addWishlistResponse.body.wishlistCount, 1);

  const wishlistResponse = await request(app)
    .get('/api/users/me/wishlist')
    .set('Authorization', `Bearer ${buyer.token}`);

  assert.equal(wishlistResponse.statusCode, 200);
  assert.equal(wishlistResponse.body.products.length, 1);
  assert.equal(wishlistResponse.body.products[0]._id, product._id.toString());
  assert.equal(wishlistResponse.body.products[0].seller.name, 'Wishlist Seller');

  const removeWishlistResponse = await request(app)
    .post(`/api/users/me/wishlist/${product._id}`)
    .set('Authorization', `Bearer ${buyer.token}`);

  assert.equal(removeWishlistResponse.statusCode, 200);
  assert.equal(removeWishlistResponse.body.added, false);
  assert.equal(removeWishlistResponse.body.wishlistCount, 0);

  await request(app)
    .post(`/api/users/me/wishlist/${product._id}`)
    .set('Authorization', `Bearer ${buyer.token}`);

  const viewProductResponse = await request(app)
    .get(`/api/products/${product._id}`)
    .set('Authorization', `Bearer ${buyer.token}`);

  if (viewProductResponse.statusCode !== 200) {
    console.error('viewProduct failed:', viewProductResponse.body);
  }
  assert.equal(viewProductResponse.statusCode, 200);

  const recentlyViewedResponse = await request(app)
    .get('/api/users/me/recently-viewed')
    .set('Authorization', `Bearer ${buyer.token}`);

  assert.equal(recentlyViewedResponse.statusCode, 200);
  assert.equal(recentlyViewedResponse.body.products.length, 1);
  assert.equal(recentlyViewedResponse.body.products[0]._id, product._id.toString());

  const profileCompletionResponse = await request(app)
    .get('/api/users/me/profile-completion')
    .set('Authorization', `Bearer ${buyer.token}`);

  assert.equal(profileCompletionResponse.statusCode, 200);
  assert.equal(profileCompletionResponse.body.canTrade, true);

  await clearDatabase();

  const incompleteUser = await registerAndLogin(app, {
    email: 'incomplete-user@example.com',
    campus: {},
    profileRole: '',
    location: '',
  });
  await User.findByIdAndUpdate(incompleteUser.user.id, { phoneVerified: false });

  const incompleteProfileResponse = await request(app)
    .get('/api/users/me/profile-completion')
    .set('Authorization', `Bearer ${incompleteUser.token}`);

  assert.equal(incompleteProfileResponse.statusCode, 200);
  assert.equal(incompleteProfileResponse.body.canTrade, false);
  assert.ok(incompleteProfileResponse.body.missing.length > 0);
};

module.exports = {
  runUserFeatureTests,
};
