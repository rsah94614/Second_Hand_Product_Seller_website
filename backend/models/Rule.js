const mongoose = require('mongoose');

/**
 * Rule Model (Task 2.5.2)
 * Automated moderation rules for auto-flagging/suspending
 */

const RULE_TYPES = ['keyword', 'pattern', 'behavior'];
const RULE_ACTIONS = ['flag', 'suspend', 'delete', 'queue'];
const SEVERITIES = ['low', 'medium', 'high'];

const ruleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    type: {
      type: String,
      enum: RULE_TYPES,
      required: true,
    },
    condition: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      enum: RULE_ACTIONS,
      required: true,
    },
    severity: {
      type: String,
      enum: SEVERITIES,
      default: 'medium',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appliesTo: {
      type: [String], // ['product', 'user', 'order', 'review']
      default: ['product'],
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

// Index for active rules
ruleSchema.index({ isActive: 1, type: 1 });

module.exports = mongoose.model('Rule', ruleSchema);
module.exports.RULE_TYPES = RULE_TYPES;
module.exports.RULE_ACTIONS = RULE_ACTIONS;
module.exports.SEVERITIES = SEVERITIES;
