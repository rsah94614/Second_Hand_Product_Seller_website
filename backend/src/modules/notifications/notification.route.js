const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const notificationController = require('./notification.controller');

const router = express.Router();

router.get('/', auth, notificationController.getNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.patch('/read-all', auth, notificationController.markAllRead);
router.patch('/:id/read', auth, notificationController.markAsRead);

module.exports = router;
