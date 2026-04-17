const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const authController = require('./auth.controller');

const { loginLimiter, otpLimiter, registerLimiter } = require('../../shared/middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/otp/request-signup', otpLimiter, authController.requestSignupOtp);
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', loginLimiter, authController.forgotPassword);
router.post('/reset-password', loginLimiter, authController.resetPassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Email verification routes
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', auth, authController.resendVerificationEmail);

module.exports = router;
