const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const cartController = require('./cart.controller');

const router = express.Router();

router.get('/', auth, cartController.getCart);
router.post('/', auth, cartController.addToCart);
router.put('/:productId', auth, cartController.updateCartItem);
router.delete('/:productId', auth, cartController.removeFromCart);
router.post('/checkout', auth, cartController.checkout);

module.exports = router;
