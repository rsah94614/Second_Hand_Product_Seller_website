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
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  }
});

// Compound index for fetching messages between two users, sorted by time
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
// Partial index for unread-message queries (only indexes docs where read=false)
messageSchema.index(
  { receiver: 1, read: 1 },
  { partialFilterExpression: { read: false } }
);

module.exports = mongoose.model('Message', messageSchema);
