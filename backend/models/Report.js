const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: function reportNeedsProduct() {
      return this.targetType === 'product';
    },
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['product', 'user', 'chat'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  details: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },
  status: {
    type: String,
    enum: ['open', 'reviewed', 'resolved', 'dismissed'],
    default: 'open',
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', reportSchema);
