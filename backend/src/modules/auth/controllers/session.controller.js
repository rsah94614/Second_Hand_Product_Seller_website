const jwt = require('jsonwebtoken');
const User = require('../../../../models/User');
const Device = require('../../../../models/Device');
const { sendLockoutEmail } = require('../../../shared/utils/emailService');
const { getDeviceInfo } = require('../../../shared/utils/deviceFingerprint');
const {
  buildAuthUser,
  signAccessToken,
  signRefreshToken,
  getRefreshFromRequest,
  getRefreshCookieOptions,
  getRefreshCookieClearOptions,
  shouldReturnRefreshToken,
  issueSession,
} = require('../auth.service');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: `Your account has been suspended. Reason: ${user.suspendedReason || 'Violation of campus marketplace rules.'}`,
        code: 'ACCOUNT_SUSPENDED',
      });
    }

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
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        const lockoutDuration = 30 * 60 * 1000;
        const unlockTime = new Date(Date.now() + lockoutDuration);
        user.lockUntil = unlockTime;
        user.loginAttempts = 0;
        await user.save();

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

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const deviceInfo = getDeviceInfo(req);
    let device = await Device.findOne({ fingerprint: deviceInfo.fingerprint });

    if (device) {
      device.lastUsedAt = new Date();
      device.lastIpAddress = deviceInfo.ipAddress;
      device.isActive = true;
      await device.save();
    } else {
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
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    user.refreshTokens.push(newRefreshToken);

    if (user.refreshTokens.length > 5) {
      user.refreshTokens.shift();
    }

    await user.save();

    res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

    const body = {
      message: 'Token refreshed successfully',
      token: newAccessToken,
    };

    if (shouldReturnRefreshToken(req)) {
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

module.exports = {
  login,
  getMe,
  refreshToken,
  logout,
};
