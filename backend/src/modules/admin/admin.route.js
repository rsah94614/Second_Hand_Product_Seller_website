const express = require('express');
const { adminAuth } = require('../../shared/middleware/auth.middleware');

const dashboardController = require('./controllers/dashboard.controller');
const userManagementController = require('./controllers/userManagement.controller');
const listingManagementController = require('./controllers/listingManagement.controller');
const orderManagementController = require('./controllers/orderManagement.controller');
const moderationController = require('./controllers/moderation.controller');
const ruleManagementController = require('./controllers/ruleManagement.controller');
const categoryManagementController = require('./controllers/categoryManagement.controller');

const router = express.Router();

router.get('/overview', adminAuth, dashboardController.getOverview);

router.get('/users', adminAuth, userManagementController.getUsers);
router.get('/users/suspicious', adminAuth, userManagementController.getSuspiciousUsers);
router.patch('/users/:id/suspend', adminAuth, userManagementController.suspendUser);
router.patch('/users/:id', adminAuth, userManagementController.updateUser);

router.get('/products', adminAuth, listingManagementController.getProducts);
router.get('/products/suspicious', adminAuth, listingManagementController.getSuspiciousProducts);
router.patch('/products/:id', adminAuth, listingManagementController.updateProduct);
router.delete('/products/:id', adminAuth, listingManagementController.deleteProduct);

router.get('/orders', adminAuth, orderManagementController.getOrders);
router.patch('/orders/:id', adminAuth, orderManagementController.updateOrder);

router.get('/reports', adminAuth, moderationController.getReports);
router.patch('/reports/:id', adminAuth, moderationController.updateReport);

router.get('/categories', adminAuth, categoryManagementController.getCategories);

router.get('/audit-logs', adminAuth, dashboardController.getAuditLogs);

// ── Moderation Queue (Task 2.5.1) ────────────────────────────────────────────
router.get('/moderation-queue', adminAuth, moderationController.getModerationQueue);
router.post('/moderation-queue', adminAuth, moderationController.addToModerationQueue);
router.patch('/moderation-queue/:id/assign', adminAuth, moderationController.assignModerationItem);
router.patch('/moderation-queue/:id/resolve', adminAuth, moderationController.resolveModerationItem);
router.get('/moderation-queue/stats', adminAuth, moderationController.getModerationStats);

// ── Automated Moderation Rules (Task 2.5.2) ──────────────────────────────────
router.get('/rules', adminAuth, ruleManagementController.getRules);
router.post('/rules', adminAuth, ruleManagementController.createRule);
router.put('/rules/:id', adminAuth, ruleManagementController.updateRule);
router.delete('/rules/:id', adminAuth, ruleManagementController.deleteRule);
router.patch('/rules/:id/toggle', adminAuth, ruleManagementController.toggleRule);

// ── Seller Verification (Task 2.7.1) ──────────────────────────────────────────
router.get('/seller-verifications', adminAuth, userManagementController.getSellerVerifications);
router.post('/seller-verifications/:id/approve', adminAuth, userManagementController.approveSellerVerification);
router.post('/seller-verifications/:id/reject', adminAuth, userManagementController.rejectSellerVerification);

// ── Activity Timeline (Phase 3 - Task 3.3.1) ─────────────────────────────────
router.get('/activity', adminAuth, dashboardController.getActivityTimeline);

// ── Bulk Actions (Phase 3 - Task 3.3.2) ──────────────────────────────────────
router.post('/bulk/users/suspend', adminAuth, userManagementController.bulkSuspendUsers);
router.post('/bulk/products/delete', adminAuth, listingManagementController.bulkDeleteProducts);
router.post('/bulk/products/update', adminAuth, listingManagementController.bulkUpdateProducts);

module.exports = router;

