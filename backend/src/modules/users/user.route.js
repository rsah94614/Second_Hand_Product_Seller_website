const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const userController = require('./user.controller');
const upload = require('../../shared/middleware/upload.middleware');

const router = express.Router();

// ── Profile & Wishlist ────────────────────────────────────────────────────────
router.get('/me/wishlist', auth, userController.getWishlist);
router.get('/me/recently-viewed', auth, userController.getRecentlyViewed);
router.get('/me/profile-completion', auth, userController.getProfileCompletion);
router.post('/me/wishlist/:productId', auth, userController.toggleWishlist);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.post('/:id/reviews', auth, userController.addSellerReview);

// ── Block / Unblock ───────────────────────────────────────────────────────────
router.get('/me/blocked', auth, userController.getBlockedUsers);
router.post('/block/:userId', auth, userController.blockUser);
router.delete('/block/:userId', auth, userController.unblockUser);

// ── Seller Verification (Task 2.7.1) ──────────────────────────────────────────
router.post('/me/seller-verification', auth, userController.requestSellerVerification);
router.get('/me/seller-verification', auth, userController.getSellerVerificationStatus);

// ── Reputation System (Task 2.7.2) ────────────────────────────────────────────
router.get('/me/reputation', auth, userController.getUserReputation);
router.get('/me/reputation/history', auth, userController.getUserReputationHistory);
router.get('/:id/reputation', userController.getUserReputation);
router.get('/:id/reputation/history', userController.getUserReputationHistory);

// ── Public profile ────────────────────────────────────────────────────────────
router.get('/:id', userController.getUserProfile);
router.post('/:id/avatar', auth, upload.single('avatar'), userController.uploadAvatar);
router.put('/:id', auth, userController.updateUserProfile);

module.exports = router;
