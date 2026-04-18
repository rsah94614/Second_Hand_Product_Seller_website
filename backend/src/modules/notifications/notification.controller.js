const {
  getNotificationsForUser,
  getUnreadCountForUser,
  markAllReadForUser,
  markOneReadForUser,
} = require('./notification.service');
const { emitUnreadCount } = require('../../shared/utils/notification.utils');
const NotificationPreference = require('../../../models/NotificationPreference');
const Notification = require('../../../models/Notification');

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

// ─── Notification Preferences (Task 2.4.1) ───────────────────────────────────

const getPreferences = async (req, res) => {
  try {
    let preferences = await NotificationPreference.findOne({ user: req.user._id });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await NotificationPreference.create({
        user: req.user._id,
      });
    }

    return res.json(preferences);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      orderUpdates,
      chatMessages,
      productUpdates,
      promotions,
      weeklyDigest,
      adminAlerts,
    } = req.body;

    let preferences = await NotificationPreference.findOne({ user: req.user._id });

    if (!preferences) {
      // Create new preferences
      preferences = await NotificationPreference.create({
        user: req.user._id,
        emailNotifications,
        smsNotifications,
        pushNotifications,
        orderUpdates,
        chatMessages,
        productUpdates,
        promotions,
        weeklyDigest,
        adminAlerts,
      });
    } else {
      // Update existing preferences
      if (emailNotifications !== undefined) preferences.emailNotifications = emailNotifications;
      if (smsNotifications !== undefined) preferences.smsNotifications = smsNotifications;
      if (pushNotifications !== undefined) preferences.pushNotifications = pushNotifications;
      if (orderUpdates !== undefined) preferences.orderUpdates = orderUpdates;
      if (chatMessages !== undefined) preferences.chatMessages = chatMessages;
      if (productUpdates !== undefined) preferences.productUpdates = productUpdates;
      if (promotions !== undefined) preferences.promotions = promotions;
      if (weeklyDigest !== undefined) preferences.weeklyDigest = weeklyDigest;
      if (adminAlerts !== undefined) preferences.adminAlerts = adminAlerts;

      await preferences.save();
    }

    return res.json({
      message: 'Notification preferences updated',
      preferences,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Notification Snooze (Task 2.4.2) ────────────────────────────────────────

const snoozeNotification = async (req, res) => {
  try {
    const { duration } = req.body;

    // Validate duration
    const snoozeDurations = {
      '1h': 60 * 60 * 1000,           // 1 hour
      '1d': 24 * 60 * 60 * 1000,      // 1 day
      '1w': 7 * 24 * 60 * 60 * 1000,  // 1 week
    };

    if (!duration || !snoozeDurations[duration]) {
      return res.status(400).json({
        message: 'Invalid duration. Use "1h", "1d", or "1w"',
      });
    }

    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Calculate snooze until time
    const snoozedUntil = new Date(Date.now() + snoozeDurations[duration]);
    notification.snoozedUntil = snoozedUntil;
    await notification.save();

    return res.json({
      message: `Notification snoozed until ${snoozedUntil.toLocaleString('en-IN')}`,
      notification,
      resumeAt: snoozedUntil,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const unsnoozeNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.snoozedUntil = null;
    await notification.save();

    return res.json({
      message: 'Notification unsnoozed',
      notification,
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
  getPreferences,
  updatePreferences,
  snoozeNotification,
  unsnoozeNotification,
};

// ─── Notification Grouping (Phase 3 - Task 3.4.2) ────────────────────────────

const getGroupedNotifications = async (req, res) => {
  try {
    const now = new Date();

    // Fetch recent non-snoozed notifications
    const notifications = await Notification.find({
      user: req.user._id,
      $or: [{ snoozedUntil: null }, { snoozedUntil: { $lte: now } }],
    })
      .populate('actor', 'name avatar')
      .populate('product', 'title images')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Group by groupKey (type + related entity)
    const groups = {};

    for (const notif of notifications) {
      // Build a group key: type + product/order/report id (if any)
      const key =
        notif.groupKey ||
        [
          notif.type,
          notif.product?._id?.toString() || '',
          notif.order?.toString() || '',
        ]
          .filter(Boolean)
          .join(':');

      if (!groups[key]) {
        groups[key] = {
          key,
          type: notif.type,
          title: notif.title,
          latestMessage: notif.message,
          count: 0,
          isRead: true,
          notifications: [],
          latestAt: notif.createdAt,
          product: notif.product || null,
          link: notif.link,
        };
      }

      groups[key].count += 1;
      groups[key].notifications.push(notif);
      if (!notif.isRead) groups[key].isRead = false;
      if (new Date(notif.createdAt) > new Date(groups[key].latestAt)) {
        groups[key].latestAt = notif.createdAt;
        groups[key].latestMessage = notif.message;
        groups[key].title = notif.title;
      }
    }

    // Convert to sorted array
    const result = Object.values(groups).sort(
      (a, b) => new Date(b.latestAt) - new Date(a.latestAt)
    );

    return res.json({
      groups: result,
      totalGroups: result.length,
      unreadGroups: result.filter((g) => !g.isRead).length,
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
  getPreferences,
  updatePreferences,
  snoozeNotification,
  unsnoozeNotification,
  getGroupedNotifications,
};
