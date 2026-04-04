const assert = require('node:assert/strict');
const request = require('supertest');
const Notification = require('../models/Notification');
const Cart = require('../models/Cart');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');
const { createProduct } = require('./helpers/products');

const shippingDetails = {
  fullName: 'Cart Buyer',
  phone: '9876501234',
  addressLine1: '42 Market Road',
  city: 'Delhi',
  state: 'Delhi',
  postalCode: '110001',
};

const runCartTests = async (app) => {
  await clearDatabase();

  const buyer = await registerAndLogin(app, {
    email: 'cart-buyer@example.com',
    name: 'Cart Buyer',
  });
  const seller = await registerAndLogin(app, {
    email: 'cart-seller@example.com',
    name: 'Cart Seller',
  });
  const product = await createProduct({
    seller: seller.user.id,
    price: 9000,
    title: 'Cart Test Product',
  });

  const addToCartResponse = await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({
      productId: product._id.toString(),
      quantity: 2,
    });

  assert.equal(addToCartResponse.statusCode, 201);
  assert.equal(addToCartResponse.body.summary.itemCount, 2);
  assert.equal(addToCartResponse.body.summary.totalAmount, 18000);

  const checkoutResponse = await request(app)
    .post('/api/cart/checkout')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({ shippingDetails });

  assert.equal(checkoutResponse.statusCode, 201);
  assert.equal(checkoutResponse.body.total, 18000);
  assert.equal(checkoutResponse.body.items.length, 1);

  const cart = await Cart.findOne({ user: buyer.user.id });
  assert.equal(cart.items.length, 0);

  const buyerNotification = await Notification.findOne({
    user: buyer.user.id,
    type: 'order_placed',
  });
  const sellerNotification = await Notification.findOne({
    user: seller.user.id,
    type: 'new_order',
  });

  assert.ok(buyerNotification);
  assert.ok(sellerNotification);

  await clearDatabase();

  const secondBuyer = await registerAndLogin(app, {
    email: 'cart-unavailable-buyer@example.com',
  });
  const secondSeller = await registerAndLogin(app, {
    email: 'cart-unavailable-seller@example.com',
  });
  const unavailableProduct = await createProduct({
    seller: secondSeller.user.id,
    isSold: true,
    title: 'Unavailable Product',
  });

  await request(app)
    .post('/api/cart')
    .set('Authorization', `Bearer ${secondBuyer.token}`)
    .send({
      productId: unavailableProduct._id.toString(),
      quantity: 1,
    });

  const unavailableCheckoutResponse = await request(app)
    .post('/api/cart/checkout')
    .set('Authorization', `Bearer ${secondBuyer.token}`)
    .send({ shippingDetails });

  assert.equal(unavailableCheckoutResponse.statusCode, 400);
  assert.match(unavailableCheckoutResponse.body.message, /no longer available/i);
};

module.exports = {
  runCartTests,
};
