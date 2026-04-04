const express = require('express');
const Notification = require('../../../models/Notification');
const auth = require('../../shared/middleware/auth.middleware');
const {
  notificationPopulate,
  emitUnreadCount,
} = require('../../shared/utils/notification.utils');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread = '' } = req.query;
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.min(50, Math.max(1, Number(limit) || 20));

    const query = { user: req.user._id };
    if (unread === 'true') {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate(notificationPopulate)
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    return res.json({
      notifications,
      unreadCount,
      total,
      currentPage: numericPage,
      totalPages: Math.ceil(total / numericLimit),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    await emitUnreadCount(req.user._id);

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    await emitUnreadCount(req.user._id);

    const populatedNotification = await Notification.findById(notification._id)
      .populate(notificationPopulate)
      .lean();

    return res.json({
      message: 'Notification marked as read',
      notification: populatedNotification,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
