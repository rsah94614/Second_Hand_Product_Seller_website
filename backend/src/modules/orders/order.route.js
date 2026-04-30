const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const orderController = require('./order.controller');
const multer = require('multer');

const router = express.Router();

// Multer configuration for confirmation photo upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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

// ── Confirmation photo (Task 2.3.2) ───────────────────────────────────────────
router.post('/:id/confirmation-photo', auth, upload.single('photo'), orderController.uploadConfirmationPhoto);

// ── Dispute system (Task 2.3.3) ──────────────────────────────────────────────
router.post('/:id/dispute', auth, upload.array('evidence', 5), orderController.createDispute);
router.get('/disputes/all', auth, orderController.getDisputes); // Admin only
router.get('/disputes/:disputeId', auth, orderController.getDisputeById);
router.patch('/disputes/:disputeId/resolve', auth, orderController.resolveDispute); // Admin only
router.patch('/disputes/:disputeId/reject', auth, orderController.rejectDispute); // Admin only

module.exports = router;
