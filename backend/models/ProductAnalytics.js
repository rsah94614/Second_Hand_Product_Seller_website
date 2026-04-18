/**
 * ProductAnalytics Model (Phase 3 - Task 3.2.2)
 * Tracks views, inquiries, and conversions per product
 */
const mongoose = require('mongoose');

const productAnalyticsSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // View tracking
    totalViews: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    // Inquiry tracking (chat initiated from product page)
    totalInquiries: { type: Number, default: 0 },
    // Order/conversion tracking
    totalOrders: { type: Number, default: 0 },
    // Wishlist saves
    wishlistSaves: { type: Number, default: 0 },
    // Daily breakdown (last 30 days)
    dailyStats: [
      {
        date: { type: String }, // YYYY-MM-DD
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
        orders: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

productAnalyticsSchema.index({ product: 1 });
productAnalyticsSchema.index({ seller: 1 });

module.exports = mongoose.model('ProductAnalytics', productAnalyticsSchema);
