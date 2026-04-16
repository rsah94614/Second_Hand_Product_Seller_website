const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const orderController = require('./order.controller');

const router = express.Router();

// ── Place a deal request (buyer) ──────────────────────────────────────────────
router.post('/', auth, orderController.createOrder);

// ── Read orders (buyer: default, seller: ?role=seller) ───────────────────────
router.get('/', auth, orderController.getOrders);
router.get('/:id', auth, orderController.getOrderById);

// ── Status transitions ────────────────────────────────────────────────────────
router.patch('/:id/accept', auth, orderController.acceptOrder);          // seller accepts
router.patch('/:id/meetup', auth, orderController.scheduleMeetup);       // either party schedules
router.patch('/:id/complete', auth, orderController.markCompleted);      // buyer confirms done
router.patch('/:id/no-show', auth, orderController.markNoShow);         // either reports no-show
router.patch('/:id/cancel', auth, orderController.cancelOrder);          // either cancels

module.exports = router;
