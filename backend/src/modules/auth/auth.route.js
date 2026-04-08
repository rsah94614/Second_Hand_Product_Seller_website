const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const authController = require('./auth.controller');

const { authLimiter } = require('../../shared/middleware/rateLimiter.middleware');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
