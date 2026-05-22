const mongoose = require('mongoose');

/**
 * EmailDeliveryLog Collection
 * 
 * Tracks email delivery attempts and status for weekly report summaries.
 * Includes indexes on jobId, adminId, and status for efficient querying and monitoring.
 * 
 * **Validates: Requirements 9, 17, 19 (Email delivery, email specifications, monitoring)**
 */

const emailDeliveryLogSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: ['dashboard', 'top-products', 'categories', 'trends', 'sellers', 'payments', 'transactions', 'weekly-summary'],
      default: 'weekly-summary',
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    attempts: [
      {
        attemptNumber: {
          type: Number,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['sent', 'failed', 'bounced', 'pending'],
          required: true,
        },
        error: {
          type: String,
          default: '',
        },
        nextRetry: {
          type: Date,
          default: null,
        },
      },
    ],
    finalStatus: {
      type: String,
      enum: ['delivered', 'failed', 'bounced', 'pending'],
      default: 'pending',
      index: true,
    },
    messageId: {
      type: String,
      default: '',
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

// Compound index for efficient querying by jobId, adminId, and status
emailDeliveryLogSchema.index({ jobId: 1, adminId: 1, finalStatus: 1 });

// Index for finding delivery logs by admin
emailDeliveryLogSchema.index({ adminId: 1, createdAt: -1 });

// Index for finding failed deliveries
emailDeliveryLogSchema.index({ finalStatus: 1, createdAt: -1 });

// Index for finding pending retries
emailDeliveryLogSchema.index({ finalStatus: 1, 'attempts.nextRetry': 1 });

// Index for finding deliveries by message ID
emailDeliveryLogSchema.index({ messageId: 1 });

module.exports = mongoose.model('EmailDeliveryLog', emailDeliveryLogSchema);
