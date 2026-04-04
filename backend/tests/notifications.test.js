const assert = require('node:assert/strict');
const request = require('supertest');
const Notification = require('../models/Notification');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');

const runNotificationTests = async (app) => {
  await clearDatabase();

  const firstUser = await registerAndLogin(app, {
    email: 'notify@example.com',
  });

  await Notification.create({
    user: firstUser.user.id,
    type: 'new_message',
    title: 'New message from Asha',
    message: 'Interested in your listing.',
    link: '/chat',
  });

  const listResponse = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${firstUser.token}`);

  assert.equal(listResponse.statusCode, 200);
  assert.equal(listResponse.body.unreadCount, 1);
  assert.equal(listResponse.body.notifications.length, 1);
  assert.equal(listResponse.body.notifications[0].title, 'New message from Asha');

  await clearDatabase();

  const secondUser = await registerAndLogin(app, {
    email: 'read@example.com',
  });

  const notification = await Notification.create({
    user: secondUser.user.id,
    type: 'order_status_updated',
    title: 'Order status updated',
    message: 'Your order is now shipped.',
    link: '/orders',
  });

  const readResponse = await request(app)
    .patch(`/api/notifications/${notification._id}/read`)
    .set('Authorization', `Bearer ${secondUser.token}`);

  assert.equal(readResponse.statusCode, 200);
  assert.equal(readResponse.body.notification.isRead, true);

  const countResponse = await request(app)
    .get('/api/notifications/unread-count')
    .set('Authorization', `Bearer ${secondUser.token}`);

  assert.equal(countResponse.statusCode, 200);
  assert.equal(countResponse.body.unreadCount, 0);

  await clearDatabase();

  const thirdUser = await registerAndLogin(app, {
    email: 'bulk@example.com',
  });

  await Notification.create([
    {
      user: thirdUser.user.id,
      type: 'wishlist_price_update',
      title: 'Price dropped on a saved item',
      message: 'A saved listing is cheaper now.',
      link: '/wishlist',
    },
    {
      user: thirdUser.user.id,
      type: 'new_review',
      title: 'New review received',
      message: 'Someone reviewed your product.',
      link: '/notifications',
    },
  ]);

  const markAllResponse = await request(app)
    .patch('/api/notifications/read-all')
    .set('Authorization', `Bearer ${thirdUser.token}`);

  assert.equal(markAllResponse.statusCode, 200);

  const unreadNotifications = await Notification.countDocuments({
    user: thirdUser.user.id,
    isRead: false,
  });

  assert.equal(unreadNotifications, 0);
};

module.exports = {
  runNotificationTests,
};
