const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const { sendResetEmail } = require('../../shared/utils/emailService');
const { detectCollegeDomain, buildAuthUser, signAccessToken, signRefreshToken } = require('./auth.service');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, location, campus } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const collegeInfo = detectCollegeDomain(email);
    const isVerified = !!collegeInfo?.verified;

    const campusData = {
      collegeName: campus?.collegeName || collegeInfo?.collegeName || '',
      department: campus?.department || '',
      year: campus?.year || '',
      enrollmentId: campus?.enrollmentId || '',
      hostel: campus?.hostel || '',
    };

    const user = new User({
      name, email, password, phone, location,
      campus: campusData,
      isVerified,
      role: 'user',
    });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshTokens = [refreshToken];
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(201).json({
      message: 'User created successfully',
      token: accessToken,
      user: buildAuthUser(user),
    });
  } catch (error) {
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

    if (!user.role) {
      user.role = 'user';
      await user.save();
    } else if (user.role !== 'admin' && user.role !== 'user') {
      user.role = 'user';
      await user.save();
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    if (!user.refreshTokens) user.refreshTokens = [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.json({
      message: 'Login successful',
      token: accessToken,
      user: buildAuthUser(user),
    });
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

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

    try {
      await sendResetEmail(email, resetUrl);
      return res.json({ message: 'Password reset link securely sent to your email.' });
    } catch (emailError) {
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
    await user.save();

    return res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
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

    const newAccessToken = signAccessToken(user._id);
    return res.json({ token: newAccessToken });
  } catch (error) {
    return res.status(500).json({ message: 'Could not refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const decoded = jwt.decode(token);
      if (decoded && decoded.userId) {
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: { refreshTokens: token }
        });
      }
    }
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not log out' });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, refreshToken, logout };
