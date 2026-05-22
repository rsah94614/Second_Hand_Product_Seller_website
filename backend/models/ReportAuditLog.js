const mongoose = require('mongoose');

/**
 * ReportAuditLog Collection
 * 
 * Tracks all report access, generation, and exports for compliance and audit purposes.
 * Includes indexes on adminId, action, and timestamp for efficient querying.
 * 
 * **Validates: Requirements 15, 19 (Access control, monitoring)**
 */

const reportAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['view', 'download', 'email_sent', 'email_failed', 'export_pdf', 'export_csv'],
      required: true,
      index: true,
    },
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
    details: {
      ipAddress: {
        type: String,
        default: '',
      },
      userAgent: {
        type: String,
        default: '',
      },
      downloadFormat: {
        type: String,
        enum: ['pdf', 'csv', 'email', ''],
        default: '',
      },
      fileSize: {
        type: Number,
        default: 0,
      },
      generationTimeMs: {
        type: Number,
        default: 0,
      },
      status: {
        type: String,
        enum: ['success', 'failure', 'partial'],
        default: 'success',
      },
      errorMessage: {
        type: String,
        default: '',
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying by admin, action, and timestamp
reportAuditLogSchema.index({ adminId: 1, action: 1, timestamp: -1 });

// Index for finding all actions by admin
reportAuditLogSchema.index({ adminId: 1, timestamp: -1 });

// Index for finding all actions of a specific type
reportAuditLogSchema.index({ action: 1, timestamp: -1 });

// Index for finding failed actions
reportAuditLogSchema.index({ 'details.status': 1, timestamp: -1 });

module.exports = mongoose.model('ReportAuditLog', reportAuditLogSchema);
