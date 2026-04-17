const mongoose = require('mongoose');

const registrationOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  codeHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '0' }, // TTL index
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  attemptsLeft: {
    type: Number,
    default: 3,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('RegistrationOtp', registrationOtpSchema);
