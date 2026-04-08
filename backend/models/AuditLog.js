const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    required: true,
    enum: ['User', 'Product', 'Order', 'Report', 'Category', 'System'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Logs are append-only
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
