const assert = require('node:assert/strict');
const request = require('supertest');
const Notification = require('../models/Notification');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');
const { createProduct } = require('./helpers/products');

const shippingDetails = {
  fullName: 'Rohit Kumar',
  phone: '9876543210',
  addressLine1: 'Library Gate',
  city: 'Guwahati',
  state: 'Assam',
  postalCode: '781014',
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
    stock: 1,
  });

  const createOrderResponse = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({
      productId: product._id.toString(),
      shippingDetails,
    });

  assert.equal(createOrderResponse.statusCode, 201);
  assert.equal(createOrderResponse.body.total, 18000);
  assert.equal(createOrderResponse.body.status, 'requested');
  assert.equal(createOrderResponse.body.items[0].quantity, 1);

  const acceptResponse = await request(app)
    .patch(`/api/orders/${createOrderResponse.body._id}/accept`)
    .set('Authorization', `Bearer ${seller.token}`)
    .send();

  assert.equal(acceptResponse.statusCode, 200);
  assert.equal(acceptResponse.body.order.status, 'accepted');

  const meetupResponse = await request(app)
    .patch(`/api/orders/${createOrderResponse.body._id}/meetup`)
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({
      location: 'Library Entrance',
      notes: 'Let us meet after class',
    });

  assert.equal(meetupResponse.statusCode, 200);
  assert.equal(meetupResponse.body.order.status, 'meetup_scheduled');
  assert.equal(meetupResponse.body.order.meetupDetails.location, 'Library Entrance');

  const noShowResponse = await request(app)
    .patch(`/api/orders/${createOrderResponse.body._id}/no-show`)
    .set('Authorization', `Bearer ${seller.token}`)
    .send({
      noShowBy: 'buyer',
      reason: 'Buyer did not arrive',
    });

  assert.equal(noShowResponse.statusCode, 200);
  assert.equal(noShowResponse.body.order.status, 'no_show');

  const noShowNotification = await Notification.findOne({
    user: buyer.user.id,
    type: 'order_no_show',
  });
  assert.ok(noShowNotification);

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
    stock: 5,
  });

  const directOrderResponse = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${directBuyer.token}`)
    .send({
      productId: directProduct._id.toString(),
      shippingDetails,
    });

  const acceptedOrder = await request(app)
    .patch(`/api/orders/${directOrderResponse.body._id}/accept`)
    .set('Authorization', `Bearer ${directSeller.token}`)
    .send();

  assert.equal(acceptedOrder.statusCode, 200);

  const completedOrder = await request(app)
    .patch(`/api/orders/${directOrderResponse.body._id}/complete`)
    .set('Authorization', `Bearer ${directBuyer.token}`)
    .send();

  assert.equal(completedOrder.statusCode, 200);
  assert.equal(completedOrder.body.order.status, 'completed');
  assert.equal(completedOrder.body.order.reviewUnlocked, true);

  const buyerNotification = await Notification.findOne({
    user: directBuyer.user.id,
    type: 'order_placed',
  });
  const sellerNotification = await Notification.findOne({
    user: directSeller.user.id,
    type: 'new_order',
  });
  const completionNotification = await Notification.findOne({
    user: directSeller.user.id,
    type: 'order_completed',
  });

  assert.ok(buyerNotification);
  assert.ok(sellerNotification);
  assert.ok(completionNotification);
};

module.exports = {
  runOrderTests,
};
