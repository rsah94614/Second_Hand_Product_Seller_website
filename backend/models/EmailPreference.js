const mongoose = require('mongoose');

/**
 * EmailPreference Collection
 * 
 * Stores admin email subscription preferences for weekly report summaries.
 * Includes unique index on adminId to ensure one preference record per admin.
 * 
 * **Validates: Requirements 9, 15, 17 (Email delivery, access control, email specifications)**
 */

const emailPreferenceSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subscribed: {
      type: Boolean,
      default: true,
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'never'],
      default: 'weekly',
    },
    lastEmailSent: {
      type: Date,
      default: null,
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding preferences by email
emailPreferenceSchema.index({ email: 1 });

// Index for finding subscribed admins
emailPreferenceSchema.index({ subscribed: 1, frequency: 1 });

// Index for finding preferences by last email sent (for scheduling)
emailPreferenceSchema.index({ lastEmailSent: 1, subscribed: 1 });

module.exports = mongoose.model('EmailPreference', emailPreferenceSchema);
