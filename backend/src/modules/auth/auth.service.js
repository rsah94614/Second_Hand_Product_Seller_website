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
  emailVerified: user.emailVerified || false,
  location: user.location,
  avatar: user.avatar || '',
  role: user.role,
  isVerified: user.isVerified || false,
  profileRole: user.profileRole || '',
  campus: user.campus || {},
  averageRating: user.averageRating || 0,
  reviewCount: user.reviewCount || 0,
  wishlist: (user.wishlist || []).map((item) => item.toString()),
  wishlistCount: user.wishlist?.length || 0,
  blocked: (user.blocked || []).map((b) => (b.userId || b).toString()),
});

const signAccessToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '60d' });
const signRefreshToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '180d' });
const hashOtpCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');
const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Return OTP debug payload only in development mode
 * SECURITY: Never expose OTP in production
 */
const otpDebugPayload = (code) => {
  // Only return debug code in development AND if explicitly enabled
  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && (process.env.OTP_DEBUG === 'true' || process.env.NODE_ENV === 'test')) {
    return { otpDebugCode: code };
  }
  return {};
};

const getRefreshCookieOptions = () => {
  const sameSite = (process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'lax' : 'strict')).toLowerCase();
  const secure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : sameSite === 'none' || process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 180 * 24 * 60 * 60 * 1000,
  };
};

const getRefreshCookieClearOptions = () => {
  const cookieOptions = getRefreshCookieOptions();
  delete cookieOptions.maxAge;
  return cookieOptions;
};

const getRefreshFromRequest = (req) => {
  if (req.cookies?.refreshToken) return req.cookies.refreshToken;
  if (req.body?.refreshToken) return req.body.refreshToken;
  const auth = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  return auth || null;
};

const shouldReturnRefreshToken = (req) => {
  const client = String(req.get('X-Client') || '').toLowerCase();
  return client === 'mobile' || client === 'web';
};

const issueSession = async (req, res, user, message) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  if (!user.refreshTokens) user.refreshTokens = [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  const body = {
    message,
    token: accessToken,
    user: buildAuthUser(user),
  };

  if (shouldReturnRefreshToken(req)) body.refreshToken = refreshToken;
  return body;
};

module.exports = {
  COLLEGE_DOMAINS,
  detectCollegeDomain,
  buildAuthUser,
  signAccessToken,
  signRefreshToken,
  hashOtpCode,
  generateOtpCode,
  otpDebugPayload,
  getRefreshCookieOptions,
  getRefreshCookieClearOptions,
  getRefreshFromRequest,
  shouldReturnRefreshToken,
  issueSession,
};
