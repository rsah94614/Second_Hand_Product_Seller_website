const assert = require('node:assert/strict');
const request = require('supertest');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin, promoteUserToAdmin } = require('./helpers/auth');
const { createProduct } = require('./helpers/products');

const shippingDetails = {
  fullName: 'Admin Test Buyer',
  phone: '9876500000',
  addressLine1: '88 Admin Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  postalCode: '400001',
};

const runAdminTests = async (app) => {
  await clearDatabase();

  const admin = await registerAndLogin(app, {
    email: 'admin-suite@example.com',
    name: 'Admin Suite',
  });
  await promoteUserToAdmin(admin.user.id);

  const seller = await registerAndLogin(app, {
    email: 'admin-seller@example.com',
    name: 'Admin Seller',
  });
  const buyer = await registerAndLogin(app, {
    email: 'admin-buyer@example.com',
    name: 'Admin Buyer',
  });
  const reporter = await registerAndLogin(app, {
    email: 'admin-reporter@example.com',
    name: 'Admin Reporter',
  });
  const watcher = await registerAndLogin(app, {
    email: 'admin-watcher@example.com',
    name: 'Admin Watcher',
  });

  const product = await createProduct({
    seller: seller.user.id,
    title: 'Admin Moderation Product',
    price: 15000,
  });

  await request(app)
    .post(`/api/users/me/wishlist/${product._id}`)
    .set('Authorization', `Bearer ${watcher.token}`);

  const orderResponse = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({
      productId: product._id.toString(),
      quantity: 1,
      shippingDetails,
    });

  assert.equal(orderResponse.statusCode, 201);

  const reportResponse = await request(app)
    .post(`/api/products/${product._id}/report`)
    .set('Authorization', `Bearer ${reporter.token}`)
    .send({
      targetType: 'user',
      reason: 'Abusive behavior',
      details: 'Opening a moderation case for admin testing.',
    });

  assert.equal(reportResponse.statusCode, 201);

  const overviewResponse = await request(app)
    .get('/api/admin/overview')
    .set('Authorization', `Bearer ${admin.token}`);

  assert.equal(overviewResponse.statusCode, 200);
  assert.ok(overviewResponse.body.metrics.totalUsers >= 5);
  assert.ok(overviewResponse.body.metrics.totalProducts >= 1);

  const usersResponse = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${admin.token}`);

  assert.equal(usersResponse.statusCode, 200);
  assert.ok(usersResponse.body.users.length >= 5);

  const selfDeactivateResponse = await request(app)
    .patch(`/api/admin/users/${admin.user.id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ isActive: false });

  assert.equal(selfDeactivateResponse.statusCode, 400);

  const deactivateUserResponse = await request(app)
    .patch(`/api/admin/users/${watcher.user.id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ isActive: false });

  assert.equal(deactivateUserResponse.statusCode, 200);
  assert.equal(deactivateUserResponse.body.user.isActive, false);

  const adminProductsResponse = await request(app)
    .get('/api/admin/products')
    .set('Authorization', `Bearer ${admin.token}`);

  assert.equal(adminProductsResponse.statusCode, 200);
  assert.ok(adminProductsResponse.body.products.length >= 1);

  const productPatchResponse = await request(app)
    .patch(`/api/admin/products/${product._id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ isActive: false });

  assert.equal(productPatchResponse.statusCode, 200);
  assert.equal(productPatchResponse.body.product.isActive, false);

  const sellerStatusNotification = await Notification.findOne({
    user: seller.user.id,
    type: 'listing_deactivated',
  });
  const wishlistStatusNotification = await Notification.findOne({
    user: watcher.user.id,
    type: 'wishlist_item_unavailable',
  });

  assert.ok(sellerStatusNotification);
  assert.ok(wishlistStatusNotification);

  const adminOrdersResponse = await request(app)
    .get('/api/admin/orders')
    .set('Authorization', `Bearer ${admin.token}`);

  assert.equal(adminOrdersResponse.statusCode, 200);
  assert.ok(adminOrdersResponse.body.orders.length >= 1);

  const orderPatchResponse = await request(app)
    .patch(`/api/admin/orders/${orderResponse.body._id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ status: 'shipped' });

  assert.equal(orderPatchResponse.statusCode, 200);
  assert.equal(orderPatchResponse.body.order.status, 'shipped');

  const buyerOrderNotification = await Notification.findOne({
    user: buyer.user.id,
    type: 'order_status_updated',
  });

  assert.ok(buyerOrderNotification);

  const reportsListResponse = await request(app)
    .get('/api/admin/reports')
    .set('Authorization', `Bearer ${admin.token}`);

  assert.equal(reportsListResponse.statusCode, 200);
  assert.equal(reportsListResponse.body.reports.length, 1);

  const report = await Report.findOne({ reporter: reporter.user.id });

  const reportPatchResponse = await request(app)
    .patch(`/api/admin/reports/${report._id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      status: 'resolved',
      adminNotes: 'Case reviewed and closed.',
    });

  assert.equal(reportPatchResponse.statusCode, 200);
  assert.equal(reportPatchResponse.body.report.status, 'resolved');

  const reporterStatusNotification = await Notification.findOne({
    user: reporter.user.id,
    type: 'report_status_updated',
  });

  assert.ok(reporterStatusNotification);
};

module.exports = {
  runAdminTests,
};
