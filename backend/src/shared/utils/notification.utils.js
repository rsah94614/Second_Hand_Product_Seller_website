const Notification = require('../../../models/Notification');

let notificationIO = null;

const notificationPopulate = [
  { path: 'actor', select: 'name email role' },
  { path: 'product', select: 'title images category isSold isActive price' },
  { path: 'order', select: 'status total items shippingDetails createdAt' },
  { path: 'report', select: 'status targetType reason createdAt' },
];

const setNotificationIO = (io) => {
  notificationIO = io;
};

const emitUnreadCount = async (userId) => {
  if (!notificationIO || !userId) {
    return;
  }

  const count = await Notification.countDocuments({
    user: userId,
    isRead: false,
  });

  notificationIO.to(userId.toString()).emit('notification:unread_count', { count });
};

const emitNotification = async (userId, notification) => {
  if (!notificationIO || !userId || !notification) {
    return;
  }

  notificationIO.to(userId.toString()).emit('notification:new', notification);
  await emitUnreadCount(userId);
};

const createNotification = async ({
  userId,
  actorId = null,
  productId = null,
  orderId = null,
  reportId = null,
  type,
  title,
  message,
  link = '',
  metadata = {},
}) => {
  if (!userId || !type || !title || !message) {
    return null;
  }

  const notification = await Notification.create({
    user: userId,
    actor: actorId,
    product: productId,
    order: orderId,
    report: reportId,
    type,
    title,
    message,
    link,
    metadata,
  });

  const populatedNotification = await Notification.findById(notification._id)
    .populate(notificationPopulate)
    .lean();

  await emitNotification(userId, populatedNotification);

  return populatedNotification;
};

const createNotifications = async (userIds = [], payload = {}) => {
  const uniqueUserIds = [...new Set(
    userIds
      .filter(Boolean)
      .map((userId) => userId.toString())
  )];

  const notifications = [];

  for (const userId of uniqueUserIds) {
    const createdNotification = await createNotification({
      ...payload,
      userId,
    });

    if (createdNotification) {
      notifications.push(createdNotification);
    }
  }

  return notifications;
};

module.exports = {
  notificationPopulate,
  setNotificationIO,
  emitUnreadCount,
  createNotification,
  createNotifications,
};
