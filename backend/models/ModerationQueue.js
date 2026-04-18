const mongoose = require('mongoose');

/**
 * ModerationQueue Model (Task 2.5.1)
 * Queue items for moderation workflow
 */

const ITEM_TYPES = ['product', 'user', 'order', 'review', 'report'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in_progress', 'resolved'];

const moderationQueueSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ITEM_TYPES,
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'pending',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin queries (status + priority + createdAt)
moderationQueueSchema.index({ status: 1, priority: -1, createdAt: -1 });

// Index for assigned items
moderationQueueSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('ModerationQueue', moderationQueueSchema);
module.exports.ITEM_TYPES = ITEM_TYPES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
