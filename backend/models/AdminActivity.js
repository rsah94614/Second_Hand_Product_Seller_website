/**
 * AdminActivity Model (Phase 3 - Task 3.3.1)
 * Tracks all admin actions for the activity timeline
 */
const mongoose = require('mongoose');

const adminActivitySchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'USER_SUSPENDED', 'PRODUCT_DELETED', 'BULK_SUSPEND', etc.
    },
    targetType: {
      type: String,
      enum: ['User', 'Product', 'Order', 'Report', 'Category', 'ModerationQueue', 'Rule', 'Bulk'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // For bulk actions, store affected IDs
    affectedIds: [{ type: mongoose.Schema.Types.ObjectId }],
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

adminActivitySchema.index({ admin: 1, createdAt: -1 });
adminActivitySchema.index({ createdAt: -1 });
adminActivitySchema.index({ targetType: 1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);
