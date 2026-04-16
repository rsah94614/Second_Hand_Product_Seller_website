const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Known college email domains → auto-verified with college name
const COLLEGE_DOMAINS = {
  'gauhati.ac.in': 'Gauhati University',
  'iitg.ac.in': 'IIT Guwahati',
  'tezpur.ac.in': 'Tezpur University',
  'nits.ac.in': 'NIT Silchar',
  'dibru.ac.in': 'Dibrugarh University',
  'cusb.ac.in': 'Central University of South Bihar',
};

const detectCollegeDomain = (email) => {
  if (!email) return null;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  if (COLLEGE_DOMAINS[domain]) {
    return { domain, collegeName: COLLEGE_DOMAINS[domain], verified: true };
  }

  if (domain.endsWith('.ac.in') || domain.endsWith('.edu') || domain.endsWith('.edu.in')) {
    return { domain, collegeName: '', verified: true };
  }

  return null;
};

const buildAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  phoneVerified: user.phoneVerified || false,
  location: user.location,
  role: user.role,
  isVerified: user.isVerified || false,
  profileRole: user.profileRole || '',
  campus: user.campus || {},
  averageRating: user.averageRating || 0,
  reviewCount: user.reviewCount || 0,
  wishlist: (user.wishlist || []).map((item) => item.toString()),
  wishlistCount: user.wishlist?.length || 0,
});

const signAccessToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
const signRefreshToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
const hashOtpCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');
const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));
const otpDebugPayload = (code) =>
  process.env.NODE_ENV !== 'production' ? { otpDebugCode: code } : {};

module.exports = {
  COLLEGE_DOMAINS,
  detectCollegeDomain,
  buildAuthUser,
  signAccessToken,
  signRefreshToken,
  hashOtpCode,
  generateOtpCode,
  otpDebugPayload,
};
