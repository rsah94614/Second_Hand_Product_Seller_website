const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const userController = require('./user.controller');

const router = express.Router();

router.get('/me/wishlist', auth, userController.getWishlist);
router.get('/me/recently-viewed', auth, userController.getRecentlyViewed);
router.post('/me/wishlist/:productId', auth, userController.toggleWishlist);
router.post('/:id/reviews', auth, userController.addSellerReview);
router.get('/:id', userController.getUserProfile);
router.put('/:id', auth, userController.updateUserProfile);

module.exports = router;
