const mongoose = require('mongoose');

/**
 * NotificationPreference Model (Task 2.4.1)
 * Allows users to control their notification settings
 */

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    // Channel preferences
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    // Category preferences
    orderUpdates: {
      type: Boolean,
      default: true,
    },
    chatMessages: {
      type: Boolean,
      default: true,
    },
    productUpdates: {
      type: Boolean,
      default: true,
    },
    promotions: {
      type: Boolean,
      default: false,
    },
    weeklyDigest: {
      type: Boolean,
      default: true,
    },
    adminAlerts: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
