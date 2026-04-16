const mongoose = require('mongoose');

const CAMPUS_LOCATIONS = [
  'Main Gate',
  'Library',
  'Boys Hostel',
  'Girls Hostel',
  'Canteen',
  'Department Building',
  'Sports Complex',
  'Parking Area',
  'Student Union',
  'Admin Block',
  'Academic Building',
  'Lab Complex',
  'Auditorium',
  'Other',
];

// High-risk categories that require at least 2 images
const HIGH_RISK_CATEGORIES = ['Electronics', 'Mobile Phones', 'Laptops', 'Gadgets'];

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 600,
    default: ''
  },
  // Review dimensions (campus-specific)
  dimensions: {
    communication: { type: Number, min: 1, max: 5 },
    punctuality:   { type: Number, min: 1, max: 5 },
    itemAsDescribed: { type: Number, min: 1, max: 5 },
  },
  // Gate: review is only valid if linked to a completed order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  _id: true
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  images: [{
    type: String,
    required: true
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isSold: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  contactInfo: {
    phone: String,
    email: String
  },
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },

  // --- Listing lifecycle ---
  expiresAt: {            // NEW: auto-set to 60 days from creation
    type: Date,
  },
  isExpired: {            // NEW: set true when expire job runs
    type: Boolean,
    default: false,
  },
  relistedAt: {           // NEW: last relist date
    type: Date,
  },
  relistCount: {          // NEW: how many times relisted
    type: Number,
    default: 0,
  },

  // --- Moderation / Safety ---
  flagged: {              // NEW: admin or system flagged
    type: Boolean,
    default: false,
  },
  flaggedReason: {        // NEW
    type: String,
    trim: true,
    default: '',
  },
  riskScore: {            // NEW: 0-100, computed by heuristic on creation/update
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  moderatorNotes: {       // NEW: admin notes
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ title: 'text', description: 'text', category: 'text' });
// Index for expiry jobs
productSchema.index({ expiresAt: 1, isExpired: 1, isActive: 1 });
// Index for suspicious listing queue
productSchema.index({ riskScore: -1 });
productSchema.index({ flagged: 1 });

module.exports = mongoose.model('Product', productSchema);
module.exports.CAMPUS_LOCATIONS = CAMPUS_LOCATIONS;
module.exports.HIGH_RISK_CATEGORIES = HIGH_RISK_CATEGORIES;
