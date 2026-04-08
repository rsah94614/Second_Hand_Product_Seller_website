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
  }
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
  location: {
    type: String,
    required: true,
    trim: true
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
  }
}, {
  timestamps: true
});

// Index for search functionality
productSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
module.exports.CAMPUS_LOCATIONS = CAMPUS_LOCATIONS;
