const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      // Content is required only if there's no image
      return !this.image;
    }
  },
  // Image Sharing (Phase 3)
  image: {
    type: String,
    default: null,
  },
  imageMetadata: {
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    size: { type: Number, default: null }, // in bytes
    format: { type: String, default: null },
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Message Delivery Status (Phase 1)
  delivered: {
    type: Boolean,
    default: false,
    index: true
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },

  // --- Anti-spam / Safety ---
  flaggedSpam: {          // NEW: system or admin flagged as spam
    type: Boolean,
    default: false,
  },
  isTemplate: {           // NEW: quick-start template message
    type: Boolean,
    default: false,
  },

  // Context: which product this conversation is about
  productRef: {           // NEW: optional product this chat was initiated from
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },

  // Idempotency key for deduplication on retry (Task 4)
  idempotencyKey: {
    type: String,
    default: null,
    index: true,
    sparse: true,         // only index documents that have this field set
  },
}, { timestamps: true }); // adds createdAt and updatedAt automatically

// Compound index for fetching messages between two users, sorted by time
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
// Partial index for unread-message queries (only indexes docs where read=false)
messageSchema.index(
  { receiver: 1, read: 1 },
  { partialFilterExpression: { read: false } }
);
// Index for pagination and sorting by createdAt
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
