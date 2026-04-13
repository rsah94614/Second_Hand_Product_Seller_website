const assert = require('node:assert/strict');
const request = require('supertest');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin, promoteUserToAdmin } = require('./helpers/auth');
const { createProduct } = require('./helpers/products');

const runProductFeatureTests = async (app) => {
  await clearDatabase();

  const seller = await registerAndLogin(app, {
    email: 'review-seller@example.com',
    name: 'Review Seller',
  });
  const reviewer = await registerAndLogin(app, {
    email: 'review-buyer@example.com',
    name: 'Review Buyer',
  });
  const admin = await registerAndLogin(app, {
    email: 'review-admin@example.com',
    name: 'Review Admin',
  });
  await promoteUserToAdmin(admin.user.id);

  const product = await createProduct({
    seller: seller.user.id,
    title: 'Review Target Product',
  });

  const firstReviewResponse = await request(app)
    .post(`/api/users/${seller.user.id}/reviews`)
    .set('Authorization', `Bearer ${reviewer.token}`)
    .send({
      rating: 4,
      comment: 'Looks good and matched the description.',
      productId: product._id.toString(),
    });

  assert.equal(firstReviewResponse.statusCode, 200);
  assert.equal(firstReviewResponse.body.reviewCount, 1);
  assert.equal(firstReviewResponse.body.averageRating, 4);

  const sellerReviewNotification = await Notification.findOne({
    user: seller.user.id,
    type: 'new_review',
  });

  assert.ok(sellerReviewNotification);

  const updateReviewResponse = await request(app)
    .post(`/api/users/${seller.user.id}/reviews`)
    .set('Authorization', `Bearer ${reviewer.token}`)
    .send({
      rating: 5,
      comment: 'Updating this after using it longer.',
      productId: product._id.toString(),
    });

  assert.equal(updateReviewResponse.statusCode, 200);
  assert.equal(updateReviewResponse.body.reviewCount, 1);
  assert.equal(updateReviewResponse.body.averageRating, 5);

  const ownerReviewResponse = await request(app)
    .post(`/api/users/${seller.user.id}/reviews`)
    .set('Authorization', `Bearer ${seller.token}`)
    .send({
      rating: 5,
      comment: 'Owner review should fail.',
    });

  assert.equal(ownerReviewResponse.statusCode, 400);
  assert.match(ownerReviewResponse.body.message, /cannot review your own seller profile/i);

  const reportResponse = await request(app)
    .post(`/api/products/${product._id}/report`)
    .set('Authorization', `Bearer ${reviewer.token}`)
    .send({
      targetType: 'product',
      reason: 'Suspicious listing details',
      details: 'Testing the report pipeline.',
    });

  assert.equal(reportResponse.statusCode, 201);

  const duplicateReportResponse = await request(app)
    .post(`/api/products/${product._id}/report`)
    .set('Authorization', `Bearer ${reviewer.token}`)
    .send({
      targetType: 'product',
      reason: 'Suspicious listing details',
      details: 'Trying to submit a duplicate report.',
    });

  assert.equal(duplicateReportResponse.statusCode, 400);
  assert.match(duplicateReportResponse.body.message, /already submitted an active report/i);

  const adminReportNotification = await Notification.findOne({
    user: admin.user.id,
    type: 'new_report',
  });
  const createdReport = await Report.findOne({
    reporter: reviewer.user.id,
    product: product._id,
  });

  assert.ok(adminReportNotification);
  assert.ok(createdReport);
};

module.exports = {
  runProductFeatureTests,
};
