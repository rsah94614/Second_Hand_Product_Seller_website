const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const RegistrationOtp = require('../../../models/RegistrationOtp');
const Device = require('../../../models/Device');
const { sendResetEmail, sendVerificationEmail, sendLockoutEmail, sendSignupOtpEmail } = require('../../shared/utils/emailService');
const { getDeviceInfo } = require('../../shared/utils/deviceFingerprint');
const { validatePasswordStrength, isCommonPassword } = require('../../shared/utils/passwordValidator');
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
    const { name, email, password, location, campus, profileRole, otp, termsAccepted, privacyAccepted } = req.body;

    // ── Terms Acceptance Check ─────────────────────────────────────────────
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions to register' });
    }

    if (!privacyAccepted) {
      return res.status(400).json({ message: 'You must accept the privacy policy to register' });
    }

    // ── Email uniqueness check ─────────────────────────────────────────────
    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // ── Password Strength Validation ───────────────────────────────────────
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    if (isCommonPassword(password)) {
      return res.status(400).json({
        message: 'Password is too common. Please choose a stronger password.',
      });
    }

    // ── OTP Verification ───────────────────────────────────────────────────
    if (!otp) {
      return res.status(400).json({ message: 'Email verification is required to complete registration' });
    }

    const regOtp = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (!regOtp) {
      return res.status(400).json({ message: 'No active verification request found for this email' });
    }

    if (new Date(regOtp.expiresAt).getTime() < Date.now()) {
      await RegistrationOtp.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    if (regOtp.codeHash !== hashOtpCode(otp)) {
      regOtp.attemptsLeft -= 1;
      if (regOtp.attemptsLeft <= 0) {
        await RegistrationOtp.deleteOne({ email: normalizedEmail });
        return res.status(400).json({ message: 'Too many invalid attempts. Please request a new code.' });
      }
      await regOtp.save();
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // OTP is valid, proceed with registration
    const collegeInfo = detectCollegeDomain(normalizedEmail);
    const isVerified = !!collegeInfo?.verified;

    const campusData = {
      collegeName: campus?.collegeName || collegeInfo?.collegeName || '',
      department: campus?.department || '',
      course: campus?.course || '',
      year: campus?.year || '',
      semester: campus?.semester || '',
      enrollmentId: campus?.enrollmentId || '',
      hostel: campus?.hostel || '',
      residentType: campus?.residentType || '',
    };

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      location,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyAccepted: true,
      privacyAcceptedAt: new Date(),
      campus: campusData,
      profileRole: profileRole || 'student',
      isVerified,
      emailVerified: true, // Marker as verified because registration was successful via OTP
      role: 'user',
    });

    user.refreshTokens = [];
    await user.save();

    // Clean up registration OTP
    await RegistrationOtp.deleteOne({ email: normalizedEmail });

    const body = await issueSession(req, res, user, 'Account created successfully. Email verified.');
    return res.status(201).json(body);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    return res.status(500).json({ message: error.message });
  }
};

const requestSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
    }

    const now = Date.now();

    // Check cooldown
    const existingOtp = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (existingOtp && now - new Date(existingOtp.requestedAt).getTime() < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - new Date(existingOtp.requestedAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another code.`, cooldownSeconds: waitSeconds });
    }

    const code = generateOtpCode();

    await RegistrationOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        codeHash: hashOtpCode(code),
        expiresAt: new Date(now + OTP_TTL_MS),
        requestedAt: new Date(now),
        attemptsLeft: 3,
      },
      { upsert: true }
    );

    // Send Email
    try {
      await sendSignupOtpEmail(normalizedEmail, code);
    } catch (error) {
      console.error('Failed to send signup OTP Email:', error);

      // Development Fallback: Log to terminal so developer can see the code
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[DEV ONLY] SIGNUP OTP FOR ${normalizedEmail}: ${code}\n`);
      }

      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
      }
    }

    return res.json(buildOtpResponse({ message: 'Verification code sent to your email address.', email: normalizedEmail }, code));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body; // 'email' field is used as the unique identifier

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
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

    // ── Account Lockout check ──────────────────────────────────────────────
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      return res.status(403).json({
        message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${waitMinutes} minutes.`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    if (!user.role || !['admin', 'user'].includes(user.role)) {
      user.role = 'user';
      await user.save();
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        const lockoutDuration = 30 * 60 * 1000; // 30 minutes
        const unlockTime = new Date(Date.now() + lockoutDuration);
        user.lockUntil = unlockTime;
        user.loginAttempts = 0; // Reset for next cycle after unlock
        await user.save();

        // Notify user via email
        try {
          await sendLockoutEmail(user.email, unlockTime);
        } catch (emailError) {
          console.error('Failed to send lockout email:', emailError);
        }

        return res.status(403).json({
          message: 'Too many failed login attempts. Your account has been locked for 30 minutes.',
          code: 'ACCOUNT_LOCKED',
        });
      }

      await user.save();
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // ── Device Tracking ────────────────────────────────────────────────────
    const deviceInfo = getDeviceInfo(req);

    // Check if device already exists
    let device = await Device.findOne({ fingerprint: deviceInfo.fingerprint });

    if (device) {
      // Update existing device
      device.lastUsedAt = new Date();
      device.lastIpAddress = deviceInfo.ipAddress;
      device.isActive = true;
      await device.save();
    } else {
      // Create new device
      device = new Device({
        userId: user._id,
        ...deviceInfo,
      });
      await device.save();
    }

    const body = await issueSession(req, res, user, 'Login successful');
    return res.json(body);
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

    // ── Password Strength Validation ───────────────────────────────────────
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    if (isCommonPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password is too common. Please choose a stronger password.',
      });
    }

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

    // ── Token Rotation: Generate new refresh token ─────────────────────────
    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    // Remove old token and add new one
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    user.refreshTokens.push(newRefreshToken);

    // Limit tokens per user (max 5 active tokens)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift(); // Remove oldest token
    }

    await user.save();

    // Set new refresh token in cookie
    res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

    const body = {
      message: 'Token refreshed successfully',
      token: newAccessToken,
    };

    // For mobile clients, include refresh token in response
    if (isMobileClient(req)) {
      body.refreshToken = newRefreshToken;
    }

    return res.json(body);
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

/**
 * Verify email with token
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Email verification token is invalid or has expired' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({
      message: 'Email verified successfully',
      user: buildAuthUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Resend email verification
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = new URL(`/verify-email?token=${emailVerificationToken}`, clientUrl).toString();

    try {
      await sendVerificationEmail(user.email, verificationUrl, user.name);
      return res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get list of devices
 */
const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user._id, isActive: true })
      .select('-__v')
      .sort({ lastUsedAt: -1 });

    return res.json({
      message: 'Devices retrieved successfully',
      devices,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Remove device
 */
const removeDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({
      _id: deviceId,
      userId: req.user._id,
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isActive = false;
    await device.save();

    return res.json({ message: 'Device removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Logout from device
 */
const logoutFromDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({
      _id: deviceId,
      userId: req.user._id,
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isActive = false;
    await device.save();

    return res.json({ message: 'Logged out from device successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Trust device
 */
const trustDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({
      _id: deviceId,
      userId: req.user._id,
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    device.isTrusted = true;
    await device.save();

    return res.json({
      message: 'Device marked as trusted',
      device,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  requestSignupOtp,
  getMe,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  verifyEmail,
  resendVerificationEmail,
  getDevices,
  removeDevice,
  logoutFromDevice,
  trustDevice,
};
