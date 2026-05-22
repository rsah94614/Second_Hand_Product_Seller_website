const mongoose = require('mongoose');

/**
 * ReportSnapshot Collection
 * 
 * Stores periodic snapshots of report data for historical analysis and archival.
 * Includes TTL index for 2-year retention policy.
 * 
 * **Validates: Requirements 12, 14, 15, 19 (Data accuracy, retention, access control, monitoring)**
 */

const reportSnapshotSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['dashboard', 'top-products', 'categories', 'trends', 'sellers', 'payments', 'transactions'],
      required: true,
      index: true,
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
    metrics: {
      totalRevenue: {
        type: Number,
        default: 0,
      },
      salesVolume: {
        type: Number,
        default: 0,
      },
      avgOrderValue: {
        type: Number,
        default: 0,
      },
      activeSellers: {
        type: Number,
        default: 0,
      },
      // Additional report-specific metrics stored as flexible object
      additionalMetrics: mongoose.Schema.Types.Mixed,
    },
    data: {
      type: Array,
      default: [],
    },
    checksum: {
      type: String,
      required: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      default: 'success',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    generationTimeMs: {
      type: Number,
      default: 0,
    },
    recordsProcessed: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // TTL index: 2 years (730 days = 63,072,000 seconds)
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for 2-year retention (expireAfterSeconds: 0 means use the expiresAt field value)
reportSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient querying by report type and date range
reportSnapshotSchema.index({ reportType: 1, 'dateRange.startDate': 1, 'dateRange.endDate': 1 });

// Index for finding snapshots by admin and report type
reportSnapshotSchema.index({ generatedBy: 1, reportType: 1, createdAt: -1 });

// Index for status queries
reportSnapshotSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ReportSnapshot', reportSnapshotSchema);
