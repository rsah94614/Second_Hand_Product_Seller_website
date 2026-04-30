/**
 * SearchHistory Model (Phase 3 - Task 3.5.1)
 * Stores per-user search history and global popular searches
 */
const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = anonymous / global stat
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    resultsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// TTL: auto-delete user search history after 30 days
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
searchHistorySchema.index({ query: 1 }); // for popular search aggregation

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
