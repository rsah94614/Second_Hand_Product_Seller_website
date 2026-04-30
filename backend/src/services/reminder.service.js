const cron = require('node-cron');
const Order = require('../../models/Order');
const { createNotification } = require('../shared/utils/notification.utils');

/**
 * Send reminder notifications before meetup
 * Task 2.3.1: Add Reminder Notifications
 */

// Format date for display
const formatMeetupTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Send 1-day reminder
const sendOneDayReminder = async (order) => {
  const meetupTime = formatMeetupTime(order.meetupDetails.scheduledAt);
  const location = order.meetupDetails.location;
  const productTitle = order.items[0]?.title || 'your item';

  // Notify buyer
  await createNotification({
    userId: order.user,
    orderId: order._id,
    type: 'meetup_reminder',
    title: 'Meetup tomorrow! 📅',
    message: `Your meetup for "${productTitle}" is tomorrow at ${meetupTime} at ${location}.`,
    link: `/orders/${order._id}`,
    metadata: { reminderType: '1day', location, scheduledAt: order.meetupDetails.scheduledAt },
  });

  // Notify seller
  await createNotification({
    userId: order.seller,
    orderId: order._id,
    type: 'meetup_reminder',
    title: 'Meetup tomorrow! 📅',
    message: `Your meetup for "${productTitle}" is tomorrow at ${meetupTime} at ${location}.`,
    link: `/orders/${order._id}`,
    metadata: { reminderType: '1day', location, scheduledAt: order.meetupDetails.scheduledAt },
  });

  // Mark reminder as sent
  order.reminders.oneDaySent = true;
  await order.save();
};

// Send 1-hour reminder
const sendOneHourReminder = async (order) => {
  const meetupTime = formatMeetupTime(order.meetupDetails.scheduledAt);
  const location = order.meetupDetails.location;
  const productTitle = order.items[0]?.title || 'your item';

  // Notify buyer
  await createNotification({
    userId: order.user,
    orderId: order._id,
    type: 'meetup_reminder',
    title: 'Meetup in 1 hour! ⏰',
    message: `Your meetup for "${productTitle}" is in 1 hour at ${meetupTime} at ${location}.`,
    link: `/orders/${order._id}`,
    metadata: { reminderType: '1hour', location, scheduledAt: order.meetupDetails.scheduledAt },
  });

  // Notify seller
  await createNotification({
    userId: order.seller,
    orderId: order._id,
    type: 'meetup_reminder',
    title: 'Meetup in 1 hour! ⏰',
    message: `Your meetup for "${productTitle}" is in 1 hour at ${meetupTime} at ${location}.`,
    link: `/orders/${order._id}`,
    metadata: { reminderType: '1hour', location, scheduledAt: order.meetupDetails.scheduledAt },
  });

  // Mark reminder as sent
  order.reminders.oneHourSent = true;
  await order.save();
};

// Check and send reminders (runs every hour)
const checkAndSendReminders = async () => {
  try {
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000; // 24 hours
    const oneHourFromNow = now + 60 * 60 * 1000; // 1 hour

    // Find orders with meetup scheduled in next 24 hours (1-day reminder)
    const ordersForOneDayReminder = await Order.find({
      status: 'meetup_scheduled',
      'meetupDetails.scheduledAt': {
        $gte: new Date(now),
        $lte: new Date(oneDayFromNow),
      },
      'reminders.oneDaySent': false,
    });

    // Find orders with meetup scheduled in next 1 hour (1-hour reminder)
    const ordersForOneHourReminder = await Order.find({
      status: 'meetup_scheduled',
      'meetupDetails.scheduledAt': {
        $gte: new Date(now),
        $lte: new Date(oneHourFromNow),
      },
      'reminders.oneHourSent': false,
    });

    // Send 1-day reminders
    for (const order of ordersForOneDayReminder) {
      await sendOneDayReminder(order);
    }

    // Send 1-hour reminders
    for (const order of ordersForOneHourReminder) {
      await sendOneHourReminder(order);
    }

    if (ordersForOneDayReminder.length > 0 || ordersForOneHourReminder.length > 0) {
      console.log(`[Reminder Service] Sent ${ordersForOneDayReminder.length} 1-day reminders and ${ordersForOneHourReminder.length} 1-hour reminders`);
    }
  } catch (error) {
    console.error('[Reminder Service] Error checking reminders:', error);
  }
};

// Start reminder cron job (runs every hour)
const startReminderService = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Reminder Service] Checking for upcoming meetups...');
    await checkAndSendReminders();
  });

  console.log('[Reminder Service] Started - checking every hour');
};

module.exports = {
  startReminderService,
  checkAndSendReminders, // Export for manual testing
};
