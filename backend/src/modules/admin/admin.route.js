const express = require('express');
const { adminAuth } = require('../../shared/middleware/auth.middleware');
const adminController = require('./admin.controller');

const router = express.Router();

router.get('/overview', adminAuth, adminController.getOverview);

router.get('/users', adminAuth, adminController.getUsers);
router.patch('/users/:id', adminAuth, adminController.updateUser);

router.get('/products', adminAuth, adminController.getProducts);
router.patch('/products/:id', adminAuth, adminController.updateProduct);
router.delete('/products/:id', adminAuth, adminController.deleteProduct);

router.get('/orders', adminAuth, adminController.getOrders);
router.patch('/orders/:id', adminAuth, adminController.updateOrder);

router.get('/reports', adminAuth, adminController.getReports);
router.patch('/reports/:id', adminAuth, adminController.updateReport);

router.get('/categories', adminAuth, adminController.getCategories);

router.get('/audit-logs', adminAuth, adminController.getAuditLogs);

module.exports = router;
