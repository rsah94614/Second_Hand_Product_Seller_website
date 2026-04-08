const {
  getNotificationsForUser,
  getUnreadCountForUser,
  markAllReadForUser,
  markOneReadForUser,
} = require('./notification.service');
const { emitUnreadCount } = require('../../shared/utils/notification.utils');

const getNotifications = async (req, res) => {
  try {
    const result = await getNotificationsForUser(req.user._id, req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await getUnreadCountForUser(req.user._id);
    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await markAllReadForUser(req.user._id);
    await emitUnreadCount(req.user._id);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const populatedNotification = await markOneReadForUser(req.user._id, req.params.id);

    if (!populatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await emitUnreadCount(req.user._id);

    return res.json({
      message: 'Notification marked as read',
      notification: populatedNotification,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markAsRead,
};
