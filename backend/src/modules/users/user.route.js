const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const profileController = require('./controllers/profile.controller');
const wishlistController = require('./controllers/wishlist.controller');
const reputationController = require('./controllers/reputation.controller');
const socialController = require('./controllers/social.controller');
const upload = require('../../shared/middleware/upload.middleware');

const router = express.Router();

// ── Profile & Wishlist ────────────────────────────────────────────────────────
router.get('/me/wishlist', auth, wishlistController.getWishlist);
router.get('/me/recently-viewed', auth, wishlistController.getRecentlyViewed);
router.get('/me/profile-completion', auth, profileController.getProfileCompletion);
router.post('/me/wishlist/:productId', auth, wishlistController.toggleWishlist);

// ── Reviews ───────────────────────────────────────────────────────────────────
router.post('/:id/reviews', auth, reputationController.addSellerReview);

// ── Block / Unblock ───────────────────────────────────────────────────────────
router.get('/me/blocked', auth, socialController.getBlockedUsers);
router.post('/block/:userId', auth, socialController.blockUser);
router.delete('/block/:userId', auth, socialController.unblockUser);

// ── Seller Verification (Task 2.7.1) ──────────────────────────────────────────
router.post('/me/seller-verification', auth, reputationController.requestSellerVerification);
router.get('/me/seller-verification', auth, reputationController.getSellerVerificationStatus);

// ── Reputation System (Task 2.7.2) ────────────────────────────────────────────
router.get('/me/reputation', auth, reputationController.getUserReputation);
router.get('/me/reputation/history', auth, reputationController.getUserReputationHistory);
router.get('/:id/reputation', reputationController.getUserReputation);
router.get('/:id/reputation/history', reputationController.getUserReputationHistory);

// ── Public profile ────────────────────────────────────────────────────────────
router.get('/:id', profileController.getUserProfile);
router.post('/:id/avatar', auth, upload.single('avatar'), profileController.uploadAvatar);
router.put('/:id', auth, profileController.updateUserProfile);

module.exports = router;
