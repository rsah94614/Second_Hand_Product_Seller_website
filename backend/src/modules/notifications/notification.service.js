const Notification = require('../../../models/Notification');
const { notificationPopulate } = require('../../shared/utils/notification.utils');

const getNotificationsForUser = async (userId, { page = 1, limit = 20, unread = '' }) => {
  const numericPage = Math.max(1, Number(page) || 1);
  const numericLimit = Math.min(50, Math.max(1, Number(limit) || 20));

  const query = { user: userId };
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
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    total,
    currentPage: numericPage,
    totalPages: Math.ceil(total / numericLimit),
  };
};

const getUnreadCountForUser = async (userId) => {
  return Notification.countDocuments({
    user: userId,
    isRead: false,
  });
};

const markAllReadForUser = async (userId) => {
  return Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
};

const markOneReadForUser = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) return null;

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  return Notification.findById(notification._id)
    .populate(notificationPopulate)
    .lean();
};

module.exports = {
  getNotificationsForUser,
  getUnreadCountForUser,
  markAllReadForUser,
  markOneReadForUser,
};
