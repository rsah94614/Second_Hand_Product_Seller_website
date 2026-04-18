const mongoose = require('mongoose');

/**
 * Dispute Model (Task 2.3.3)
 * Handles order disputes and refund requests
 */

const DISPUTE_REASONS = ['damaged', 'not_received', 'not_as_described', 'other'];
const DISPUTE_STATUSES = ['open', 'under_review', 'resolved', 'rejected'];

const disputeSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: DISPUTE_REASONS,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    evidence: [{
      type: String, // URLs to uploaded photos
    }],
    status: {
      type: String,
      enum: DISPUTE_STATUSES,
      default: 'open',
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for admin queries
disputeSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Dispute', disputeSchema);
module.exports.DISPUTE_REASONS = DISPUTE_REASONS;
module.exports.DISPUTE_STATUSES = DISPUTE_STATUSES;
