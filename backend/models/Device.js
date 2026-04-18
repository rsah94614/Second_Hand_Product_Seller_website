const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fingerprint: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userAgent: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  deviceName: {
    type: String,
    default: 'Unknown Device',
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown',
  },
  browser: {
    type: String,
    default: 'Unknown',
  },
  os: {
    type: String,
    default: 'Unknown',
  },
  lastUsedAt: {
    type: Date,
    default: Date.now,
  },
  lastIpAddress: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isTrusted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for finding devices by user
deviceSchema.index({ userId: 1, isActive: 1 });

// Index for finding devices by fingerprint
deviceSchema.index({ fingerprint: 1 });

// TTL index to auto-delete inactive devices after 30 days
deviceSchema.index({ lastUsedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Device', deviceSchema);
