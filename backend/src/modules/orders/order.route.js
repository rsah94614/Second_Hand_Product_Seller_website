const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const orderController = require('./order.controller');

const router = express.Router();

router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrders);
router.get('/:id', auth, orderController.getOrderById);
router.patch('/:id/cancel', auth, orderController.cancelOrder);

module.exports = router;
