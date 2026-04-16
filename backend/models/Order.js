const mongoose = require('mongoose');

/**
 * Campus-specific order statuses:
 *   requested       — buyer placed order, awaiting seller response
 *   accepted        — seller accepted the request
 *   meetup_scheduled — both parties agreed on a meetup time/place
 *   completed       — deal done (buyer confirms), unlocks review
 *   cancelled       — either party cancelled before meetup
 *   no_show         — meetup happened but one party did not show up
 */
const ORDER_STATUSES = ['requested', 'accepted', 'meetup_scheduled', 'completed', 'cancelled', 'no_show'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: String,
    image: String,
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,   // Always 1 for campus second-hand goods
      min: 1,
      max: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {             // buyer
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {           // NEW: denormalized seller reference for fast queries
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    items: [orderItemSchema],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'requested',   // was 'processing'
    },

    // Meetup details (NEW — campus specific)
    meetupDetails: {
      location: { type: String, trim: true, default: '' },
      scheduledAt: { type: Date },
      notes: { type: String, trim: true, maxlength: 500, default: '' },
    },

    // Review gate (NEW)
    reviewUnlocked: {
      type: Boolean,
      default: false,   // set true when status → completed
    },

    // Cancellation / no-show tracking
    cancelledBy: {
      type: String,
      enum: ['buyer', 'seller', 'admin', ''],
      default: '',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    noShowBy: {
      type: String,
      enum: ['buyer', 'seller', ''],
      default: '',
    },

    // Shipping/pickup details (kept for compat — maps to campus meetup address)
    shippingDetails: {
      fullName: String,
      phone: String,
      email: String,
      addressLine1: String,
      addressLine2: String,
      landmark: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for seller-side order queries
orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
