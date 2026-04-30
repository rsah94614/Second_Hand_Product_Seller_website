const express = require('express');
const { adminAuth } = require('../../shared/middleware/auth.middleware');
const adminController = require('./admin.controller');

const router = express.Router();

router.get('/overview', adminAuth, adminController.getOverview);

router.get('/users', adminAuth, adminController.getUsers);
router.get('/users/suspicious', adminAuth, adminController.getSuspiciousUsers);
router.patch('/users/:id/suspend', adminAuth, adminController.suspendUser);
router.patch('/users/:id', adminAuth, adminController.updateUser);

router.get('/products', adminAuth, adminController.getProducts);
router.get('/products/suspicious', adminAuth, adminController.getSuspiciousProducts);
router.patch('/products/:id', adminAuth, adminController.updateProduct);
router.delete('/products/:id', adminAuth, adminController.deleteProduct);

router.get('/orders', adminAuth, adminController.getOrders);
router.patch('/orders/:id', adminAuth, adminController.updateOrder);

router.get('/reports', adminAuth, adminController.getReports);
router.patch('/reports/:id', adminAuth, adminController.updateReport);

router.get('/categories', adminAuth, adminController.getCategories);

router.get('/audit-logs', adminAuth, adminController.getAuditLogs);

// ── Moderation Queue (Task 2.5.1) ────────────────────────────────────────────
router.get('/moderation-queue', adminAuth, adminController.getModerationQueue);
router.post('/moderation-queue', adminAuth, adminController.addToModerationQueue);
router.patch('/moderation-queue/:id/assign', adminAuth, adminController.assignModerationItem);
router.patch('/moderation-queue/:id/resolve', adminAuth, adminController.resolveModerationItem);
router.get('/moderation-queue/stats', adminAuth, adminController.getModerationStats);

// ── Automated Moderation Rules (Task 2.5.2) ──────────────────────────────────
router.get('/rules', adminAuth, adminController.getRules);
router.post('/rules', adminAuth, adminController.createRule);
router.put('/rules/:id', adminAuth, adminController.updateRule);
router.delete('/rules/:id', adminAuth, adminController.deleteRule);
router.patch('/rules/:id/toggle', adminAuth, adminController.toggleRule);

// ── Seller Verification (Task 2.7.1) ──────────────────────────────────────────
router.get('/seller-verifications', adminAuth, adminController.getSellerVerifications);
router.post('/seller-verifications/:id/approve', adminAuth, adminController.approveSellerVerification);
router.post('/seller-verifications/:id/reject', adminAuth, adminController.rejectSellerVerification);

// ── Activity Timeline (Phase 3 - Task 3.3.1) ─────────────────────────────────
router.get('/activity', adminAuth, adminController.getActivityTimeline);

// ── Bulk Actions (Phase 3 - Task 3.3.2) ──────────────────────────────────────
router.post('/bulk/users/suspend', adminAuth, adminController.bulkSuspendUsers);
router.post('/bulk/products/delete', adminAuth, adminController.bulkDeleteProducts);
router.post('/bulk/products/update', adminAuth, adminController.bulkUpdateProducts);

module.exports = router;
