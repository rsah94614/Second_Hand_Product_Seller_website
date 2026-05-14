const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const { adminAuth } = require('../../shared/middleware/auth.middleware');
const multer = require('multer');

const dealController = require('./controllers/deal.controller');
const queryController = require('./controllers/query.controller');
const fulfillmentController = require('./controllers/fulfillment.controller');
const cancellationController = require('./controllers/cancellation.controller');
const disputeController = require('./controllers/dispute.controller');

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
router.post('/', auth, dealController.createOrder);

// ── Read orders (buyer: default, seller: ?role=seller) ───────────────────────
router.get('/', auth, queryController.getOrders);
router.get('/:id', auth, queryController.getOrderById);

// ── Status transitions ────────────────────────────────────────────────────────
router.patch('/:id/accept', auth, dealController.acceptOrder);          // seller accepts
router.patch('/:id/meetup', auth, dealController.scheduleMeetup);       // either party schedules
router.patch('/:id/deliver', auth, fulfillmentController.markDelivered);       // seller: item handed over
router.patch('/:id/complete', auth, fulfillmentController.markCompleted);      // buyer confirms receipt
router.patch('/:id/no-show', auth, cancellationController.markNoShow);         // either reports no-show
router.patch('/:id/cancel', auth, cancellationController.cancelOrder);          // either cancels

// ── Confirmation photo (Task 2.3.2) ───────────────────────────────────────────
router.post('/:id/confirmation-photo', auth, upload.single('photo'), fulfillmentController.uploadConfirmationPhoto);

// ── Dispute system (Task 2.3.3) ──────────────────────────────────────────────
router.post('/:id/dispute', auth, upload.array('evidence', 5), disputeController.createDispute);
router.get('/disputes/all', adminAuth, disputeController.getDisputes);
router.get('/disputes/:disputeId', auth, disputeController.getDisputeById);
router.patch('/disputes/:disputeId/resolve', adminAuth, disputeController.resolveDispute);
router.patch('/disputes/:disputeId/reject', adminAuth, disputeController.rejectDispute);

// ── Admin: force auto-complete stale delivered orders ─────────────────────────────
router.post('/admin/auto-complete', adminAuth, fulfillmentController.autoCompleteOrders);


module.exports = router;
