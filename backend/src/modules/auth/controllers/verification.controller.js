const crypto = require('crypto');
const User = require('../../../../models/User');
const { sendVerificationEmail } = require('../../../shared/utils/emailService');
const { buildAuthUser } = require('../auth.service');

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

const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

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

module.exports = {
  verifyEmail,
  resendVerificationEmail,
};
