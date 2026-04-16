const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const { sendResetEmail } = require('../../shared/utils/emailService');
const {
  detectCollegeDomain,
  buildAuthUser,
  signAccessToken,
  signRefreshToken,
  hashOtpCode,
  generateOtpCode,
  otpDebugPayload,
} = require('./auth.service');

const isMobileClient = (req) =>
  String(req.get('X-Client') || '').toLowerCase() === 'mobile';

const getRefreshFromRequest = (req) => {
  if (req.cookies?.refreshToken) return req.cookies.refreshToken;
  if (req.body?.refreshToken) return req.body.refreshToken;
  const auth = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  return auth || null;
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
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

const getRefreshCookieClearOptions = () => {
  const cookieOptions = getRefreshCookieOptions();
  delete cookieOptions.maxAge;
  return cookieOptions;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

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

  if (isMobileClient(req)) body.refreshToken = refreshToken;
  return body;
};

const buildOtpResponse = (basePayload, code) => ({
  ...basePayload,
  ...otpDebugPayload(code),
  cooldownSeconds: Math.floor(OTP_COOLDOWN_MS / 1000),
  expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
});

const register = async (req, res) => {
  try {
    const { name, email, password, phone, location, campus, profileRole } = req.body;

    // ── Email uniqueness check ─────────────────────────────────────────────
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // ── Phone uniqueness check (required for new registrations) ───────────
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required for registration' });
    }

    const normalizedPhone = phone.trim();
    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(400).json({
        message: 'An account with this phone number already exists. Please login instead.',
      });
    }

    const collegeInfo = detectCollegeDomain(email);
    const isVerified = !!collegeInfo?.verified;

    const campusData = {
      collegeName: campus?.collegeName || collegeInfo?.collegeName || '',
      department:  campus?.department  || '',
      course:      campus?.course      || '',
      year:        campus?.year        || '',
      semester:    campus?.semester    || '',
      enrollmentId:campus?.enrollmentId|| '',
      hostel:      campus?.hostel      || '',
      residentType:campus?.residentType|| '',
    };

    const user = new User({
      name,
      email,
      password,
      phone: normalizedPhone,
      location,
      campus: campusData,
      profileRole: profileRole || '',
      isVerified,
      role: 'user',
    });

    user.refreshTokens = [];
    await user.save();

    const body = await issueSession(req, res, user, 'Account created successfully');
    return res.status(201).json(body);
  } catch (error) {
    // Handle MongoDB duplicate key error gracefully
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'phone') {
        return res.status(400).json({ message: 'An account with this phone number already exists.' });
      }
      if (field === 'email') {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }
    }
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ── Suspended account check ────────────────────────────────────────────
    if (user.isSuspended) {
      return res.status(403).json({
        message: `Your account has been suspended. Reason: ${user.suspendedReason || 'Violation of campus marketplace rules.'}`,
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (!user.role || !['admin', 'user'].includes(user.role)) {
      user.role = 'user';
      await user.save();
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const body = await issueSession(req, res, user, 'Login successful');
    return res.json(body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const requestLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = String(phone || '').trim();

    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this phone number' });
    }
    if (user.isSuspended) {
      return res.status(403).json({
        message: `Your account has been suspended. Reason: ${user.suspendedReason || 'Violation of campus marketplace rules.'}`,
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const now = Date.now();
    const requestedAt = user.otpAuth?.requestedAt ? new Date(user.otpAuth.requestedAt).getTime() : 0;
    if (requestedAt && now - requestedAt < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - requestedAt)) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another OTP.` });
    }

    const code = generateOtpCode();
    user.otpAuth = {
      codeHash: hashOtpCode(code),
      purpose: 'login',
      expiresAt: new Date(now + OTP_TTL_MS),
      requestedAt: new Date(now),
      attemptsLeft: OTP_MAX_ATTEMPTS,
      lastVerifiedAt: user.otpAuth?.lastVerifiedAt || null,
    };
    await user.save();

    return res.json(buildOtpResponse({ message: 'OTP sent to your phone number.', phone: normalizedPhone }, code));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const normalizedPhone = String(phone || '').trim();
    const normalizedOtp = String(otp || '').trim();

    if (!normalizedPhone || !normalizedOtp) {
      return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    const user = await User.findOne({ phone: normalizedPhone });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this phone number' });
    }

    const otpAuth = user.otpAuth || {};
    if (otpAuth.purpose !== 'login' || !otpAuth.codeHash || !otpAuth.expiresAt) {
      return res.status(400).json({ message: 'No active login OTP request found' });
    }

    if (new Date(otpAuth.expiresAt).getTime() < Date.now()) {
      user.otpAuth = { codeHash: '', purpose: '', expiresAt: null, requestedAt: null, attemptsLeft: 0, lastVerifiedAt: otpAuth.lastVerifiedAt || null };
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (otpAuth.attemptsLeft <= 0) {
      return res.status(429).json({ message: 'Too many invalid OTP attempts. Please request a new code.' });
    }

    if (otpAuth.codeHash !== hashOtpCode(normalizedOtp)) {
      user.otpAuth.attemptsLeft -= 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.phoneVerified = true;
    user.otpAuth = {
      codeHash: '',
      purpose: '',
      expiresAt: null,
      requestedAt: null,
      attemptsLeft: 0,
      lastVerifiedAt: new Date(),
    };

    const body = await issueSession(req, res, user, 'OTP login successful');
    return res.json(body);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const requestPhoneVerificationOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.phone?.trim()) {
      return res.status(400).json({ message: 'Add a phone number to your profile first.' });
    }

    const now = Date.now();
    const requestedAt = user.otpAuth?.requestedAt ? new Date(user.otpAuth.requestedAt).getTime() : 0;
    if (requestedAt && now - requestedAt < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - requestedAt)) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another OTP.` });
    }

    const code = generateOtpCode();
    user.otpAuth = {
      codeHash: hashOtpCode(code),
      purpose: 'verify_phone',
      expiresAt: new Date(now + OTP_TTL_MS),
      requestedAt: new Date(now),
      attemptsLeft: OTP_MAX_ATTEMPTS,
      lastVerifiedAt: user.otpAuth?.lastVerifiedAt || null,
    };
    await user.save();

    return res.json(buildOtpResponse({ message: 'Phone verification OTP sent.', phone: user.phone }, code));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyPhoneOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const normalizedOtp = String(otp || '').trim();
    if (!normalizedOtp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpAuth = user.otpAuth || {};
    if (otpAuth.purpose !== 'verify_phone' || !otpAuth.codeHash || !otpAuth.expiresAt) {
      return res.status(400).json({ message: 'No active phone verification OTP request found' });
    }

    if (new Date(otpAuth.expiresAt).getTime() < Date.now()) {
      user.otpAuth = { codeHash: '', purpose: '', expiresAt: null, requestedAt: null, attemptsLeft: 0, lastVerifiedAt: otpAuth.lastVerifiedAt || null };
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (otpAuth.attemptsLeft <= 0) {
      return res.status(429).json({ message: 'Too many invalid OTP attempts. Please request a new code.' });
    }

    if (otpAuth.codeHash !== hashOtpCode(normalizedOtp)) {
      user.otpAuth.attemptsLeft -= 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.phoneVerified = true;
    user.otpAuth = {
      codeHash: '',
      purpose: '',
      expiresAt: null,
      requestedAt: null,
      attemptsLeft: 0,
      lastVerifiedAt: new Date(),
    };
    await user.save();

    return res.json({ message: 'Phone number verified successfully', user: buildAuthUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    return res.json({ user: buildAuthUser(req.user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = new URL(`/reset-password?token=${resetToken}`, clientUrl).toString();

    try {
      await sendResetEmail(email, resetUrl);
      return res.json({ message: 'Password reset link securely sent to your email.' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({ message: 'Could not dispatch email. Ensure SMTP credentials are set.' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    return res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = getRefreshFromRequest(req);
    if (!token) return res.status(401).json({ message: 'Refresh token missing' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ message: 'Refresh token expired or invalid' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(403).json({ message: 'Invalid refresh token mapping' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    const newAccessToken = signAccessToken(user._id);
    return res.json({ token: newAccessToken });
  } catch (error) {
    return res.status(500).json({ message: 'Could not refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const token = getRefreshFromRequest(req);
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.userId) {
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: { refreshTokens: token },
        });
      }
    }

    res.clearCookie('refreshToken', getRefreshCookieClearOptions());
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not log out' });
  }
};

module.exports = {
  register,
  login,
  requestLoginOtp,
  verifyLoginOtp,
  requestPhoneVerificationOtp,
  verifyPhoneOtp,
  getMe,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
};
