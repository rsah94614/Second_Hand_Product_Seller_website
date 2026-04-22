const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const validate = require('../../shared/middleware/validate.middleware');
const { loginSchema, registerSchema } = require('../../shared/middleware/auth.schema');
const authController = require('./auth.controller');

const { loginLimiter, otpLimiter, registerLimiter } = require('../../shared/middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/otp/request-signup', otpLimiter, authController.requestSignupOtp);
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', loginLimiter, authController.forgotPassword);
router.post('/reset-password', loginLimiter, authController.resetPassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Email verification routes
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', auth, authController.resendVerificationEmail);

// Device management routes
router.get('/devices', auth, authController.getDevices);
router.delete('/devices/:deviceId', auth, authController.removeDevice);
router.post('/devices/:deviceId/logout', auth, authController.logoutFromDevice);
router.post('/devices/:deviceId/trust', auth, authController.trustDevice);

module.exports = router;
