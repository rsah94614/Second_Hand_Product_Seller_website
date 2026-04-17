const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { computeProfileScore } = require('../src/shared/utils/profileCompletion.utils');

const sellerReviewSchema = new mongoose.Schema({
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
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
  _id: true
});

const riskFlagSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['spam_listing', 'fake_price', 'repeated_reports', 'scam_attempt', 'new_account_risk', 'admin_flag'],
    required: true,
  },
  reason: { type: String, trim: true, maxlength: 300, default: '' },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = system
}, { timestamps: true, _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: ''
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  location: {
    type: String,
    trim: true
  },
  // Campus identity
  campus: {
    collegeName: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    course: { type: String, trim: true, default: '' },       // NEW: program/course
    year: {
      type: String,
      enum: ['', '1st', '2nd', '3rd', '4th', '5th', 'Alumni', 'Faculty'],
      default: ''
    },
    semester: { type: String, trim: true, default: '' },     // NEW: e.g. "3rd Sem"
    enrollmentId: { type: String, trim: true, default: '' },
    hostel: { type: String, trim: true, default: '' },
    residentType: {                                           // NEW
      type: String,
      enum: ['', 'hosteler', 'day_scholar', 'faculty'],
      default: ''
    },
  },
  profileRole: {                                              // NEW: campus role
    type: String,
    enum: ['', 'student', 'faculty', 'staff', 'alumni'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // --- Moderation / Safety ---
  isSuspended: { type: Boolean, default: false },             // NEW: admin suspension
  suspendedReason: { type: String, trim: true, default: '' }, // NEW
  suspendedAt: { type: Date },                                // NEW
  moderatorNotes: { type: String, trim: true, default: '' },  // NEW: admin notes

  // Risk tracking
  riskFlags: [riskFlagSchema],                                // NEW
  riskScore: { type: Number, default: 0, min: 0, max: 100 }, // NEW: 0-100

  // Blocked users
  blocked: [{                                                 // NEW
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // New-user listing cap enforcement
  listingsCreatedToday: { type: Number, default: 0 },         // NEW
  lastListingDate: { type: Date },                            // NEW

  // ---
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  reviews: [sellerReviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  recentlyViewed: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now }
  }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  refreshTokens: [{ type: String }],
  loginAttempts: {             // NEW: track failed logins
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {                 // NEW: timestamp for account lockout
    type: Date,
  },
  otpAuth: {
    codeHash: { type: String, default: '' },
    purpose: { type: String, enum: ['', 'login', 'verify_phone'], default: '' },
    expiresAt: { type: Date, default: null },
    requestedAt: { type: Date, default: null },
    attemptsLeft: { type: Number, default: 0 },
    lastVerifiedAt: { type: Date, default: null },
  }
}, {
  timestamps: true
});

// ---------- Virtuals ----------

/**
 * Compute profile completion score (0-100).
 * Used to gate listing creation and chat initiation.
 */
userSchema.virtual('profileCompletionScore').get(function () {
  return computeProfileScore(this);
});

/**
 * Compute trust labels for display in UI.
 * Labels are honest — no fake "Verified Student" claims.
 */
userSchema.virtual('trustLabels').get(function () {
  const labels = [];
  const ageMs = Date.now() - new Date(this.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (this.profileCompletionScore >= 80) labels.push('Profile Complete');
  if (ageDays < 7) labels.push('New Member');
  if (this.reviewCount >= 5 && this.averageRating >= 4.0) labels.push('Trusted Seller');
  if (this.reviewCount >= 10 && this.averageRating >= 4.5) labels.push('Top Rated');
  if (this.role === 'admin') labels.push('Staff Verified');

  return labels;
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

// ---------- Middleware ----------
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
