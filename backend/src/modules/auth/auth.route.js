const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const validate = require('../../shared/middleware/validate.middleware');
const { loginSchema, registerSchema } = require('../../shared/middleware/auth.schema');
const registrationController = require('./controllers/registration.controller');
const sessionController = require('./controllers/session.controller');
const passwordController = require('./controllers/password.controller');
const verificationController = require('./controllers/verification.controller');
const deviceController = require('./controllers/device.controller');

const { loginLimiter, otpLimiter, registerLimiter } = require('../../shared/middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/register', registerLimiter, validate(registerSchema), registrationController.register);
router.post('/login', loginLimiter, validate(loginSchema), sessionController.login);
router.post('/otp/request-signup', otpLimiter, registrationController.requestSignupOtp);
router.get('/me', auth, sessionController.getMe);
router.post('/forgot-password', loginLimiter, passwordController.forgotPassword);
router.post('/reset-password', loginLimiter, passwordController.resetPassword);
router.post('/refresh', sessionController.refreshToken);
router.post('/logout', sessionController.logout);

// Email verification routes
router.post('/verify-email', verificationController.verifyEmail);
router.post('/resend-verification', auth, verificationController.resendVerificationEmail);

// Device management routes
router.get('/devices', auth, deviceController.getDevices);
router.delete('/devices/:deviceId', auth, deviceController.removeDevice);
router.post('/devices/:deviceId/logout', auth, deviceController.logoutFromDevice);
router.post('/devices/:deviceId/trust', auth, deviceController.trustDevice);

module.exports = router;
