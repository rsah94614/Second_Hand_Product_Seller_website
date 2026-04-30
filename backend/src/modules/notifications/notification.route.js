const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const notificationController = require('./notification.controller');

const router = express.Router();

router.get('/', auth, notificationController.getNotifications);
router.get('/unread-count', auth, notificationController.getUnreadCount);
router.patch('/read-all', auth, notificationController.markAllRead);
router.patch('/:id/read', auth, notificationController.markAsRead);

// ── Notification Preferences (Task 2.4.1) ────────────────────────────────────
router.get('/preferences', auth, notificationController.getPreferences);
router.put('/preferences', auth, notificationController.updatePreferences);

// ── Notification Snooze (Task 2.4.2) ─────────────────────────────────────────
router.post('/:id/snooze', auth, notificationController.snoozeNotification);
router.post('/:id/unsnooze', auth, notificationController.unsnoozeNotification);

// ── Notification Grouping (Phase 3 - Task 3.4.2) ─────────────────────────────
router.get('/grouped', auth, notificationController.getGroupedNotifications);

module.exports = router;
