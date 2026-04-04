const assert = require('node:assert/strict');
const request = require('supertest');
const Notification = require('../models/Notification');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');
const { createProduct } = require('./helpers/products');

const shippingDetails = {
  fullName: 'Rohit Kumar',
  phone: '9876543210',
  addressLine1: '221B Residency',
  city: 'Kolkata',
  state: 'West Bengal',
  postalCode: '700001',
};

const runOrderTests = async (app) => {
  await clearDatabase();

  const buyer = await registerAndLogin(app, {
    email: 'buyer-orders@example.com',
    name: 'Buyer User',
  });
  const seller = await registerAndLogin(app, {
    email: 'seller-orders@example.com',
    name: 'Seller User',
  });
  const product = await createProduct({
    seller: seller.user.id,
    price: 18000,
    title: 'Order Test Phone',
  });

  const missingShippingResponse = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({
      productId: product._id.toString(),
      quantity: 1,
      shippingDetails: {
        fullName: 'Only Name',
      },
    });

  assert.equal(missingShippingResponse.statusCode, 400);
  assert.match(missingShippingResponse.body.message, /Missing required shipping fields/i);

  await clearDatabase();

  const directBuyer = await registerAndLogin(app, {
    email: 'direct-buyer@example.com',
    name: 'Direct Buyer',
  });
  const directSeller = await registerAndLogin(app, {
    email: 'direct-seller@example.com',
    name: 'Direct Seller',
  });
  const directProduct = await createProduct({
    seller: directSeller.user.id,
    price: 12000,
    title: 'Direct Order Test Product',
  });

  const createOrderResponse = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${directBuyer.token}`)
    .send({
      productId: directProduct._id.toString(),
      quantity: 2,
      shippingDetails,
    });

  assert.equal(createOrderResponse.statusCode, 201);
  assert.equal(createOrderResponse.body.total, 24000);
  assert.equal(createOrderResponse.body.status, 'processing');
  assert.equal(createOrderResponse.body.items.length, 1);
  assert.equal(createOrderResponse.body.shippingDetails.city, 'Kolkata');

  const buyerNotification = await Notification.findOne({
    user: directBuyer.user.id,
    type: 'order_placed',
  });
  const sellerNotification = await Notification.findOne({
    user: directSeller.user.id,
    type: 'new_order',
  });

  assert.ok(buyerNotification);
  assert.ok(sellerNotification);

  const listOrdersResponse = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${directBuyer.token}`);

  assert.equal(listOrdersResponse.statusCode, 200);
  assert.equal(listOrdersResponse.body.length, 1);

  const cancelResponse = await request(app)
    .patch(`/api/orders/${createOrderResponse.body._id}/cancel`)
    .set('Authorization', `Bearer ${directBuyer.token}`);

  assert.equal(cancelResponse.statusCode, 200);
  assert.equal(cancelResponse.body.order.status, 'cancelled');

  const cancelNotification = await Notification.findOne({
    user: directSeller.user.id,
    type: 'order_cancelled',
  });

  assert.ok(cancelNotification);
};

module.exports = {
  runOrderTests,
};
