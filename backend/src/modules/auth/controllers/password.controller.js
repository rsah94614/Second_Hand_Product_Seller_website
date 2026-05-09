const crypto = require('crypto');
const User = require('../../../../models/User');
const { sendResetEmail } = require('../../../shared/utils/emailService');
const { validatePasswordStrength, isCommonPassword } = require('../../../shared/utils/passwordValidator');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`[Auth] Forgot password requested for: ${email}`);
    const start = Date.now();
    const user = await User.findOne({ email });
    console.log(`[Auth] User find took: ${Date.now() - start}ms`);

    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    console.log(`[Auth] User save took: ${Date.now() - start}ms (total)`);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = new URL(`/reset-password?token=${resetToken}`, clientUrl).toString();

    // Dispatch email asynchronously - don't await to keep response fast
    console.log('[Auth] Dispatching reset email in background...');
    sendResetEmail(email, resetUrl).catch(err => {
      console.error('[Auth] Background email dispatch failed (Forgot Password):', err.message);
    });

    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

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

module.exports = {
  forgotPassword,
  resetPassword,
};
