const mongoose = require('mongoose');

/**
 * BlockedUser
 * Tracks user-to-user blocks. When A blocks B:
 *  - B cannot send messages to A via socket
 *  - A does not see B's chat requests
 */
const blockedUserSchema = new mongoose.Schema({
  blocker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  blocked: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound unique index — one block record per pair
blockedUserSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

module.exports = mongoose.model('BlockedUser', blockedUserSchema);
