const express = require('express');
const { adminAuth } = require('../../shared/middleware/auth.middleware');
const { logReportAccess, logPDFDownload } = require('../../shared/middleware/auditLog.middleware');

const reportsController = require('./controllers/reports.controller');

const router = express.Router();

// ── Phase 3.1, 3.2, 3.3 - Email Scheduler & Reports ──────────────────────────
router.get('/scheduler/status', adminAuth, reportsController.getSchedulerStatus);
router.post('/scheduler/start', adminAuth, reportsController.startScheduler);
router.post('/scheduler/stop', adminAuth, reportsController.stopScheduler);
router.post('/scheduler/trigger', adminAuth, reportsController.triggerScheduler);
router.get('/email-delivery/:jobId', adminAuth, reportsController.getEmailDeliveryStatus);
router.post('/export-pdf', adminAuth, reportsController.exportPDF);
router.get('/sales-metrics', adminAuth, reportsController.getSalesMetrics);
router.get('/payment-metrics', adminAuth, reportsController.getPaymentMetrics);
router.get('/top-sellers', adminAuth, reportsController.getTopSellers);
router.get('/sales-trends', adminAuth, reportsController.getSalesTrends);

// ── Phase 4.1 - API Endpoints - Report Retrieval ──────────────────────────────
router.get('/dashboard', adminAuth, logReportAccess('dashboard'), reportsController.getDashboardReport);
router.get('/top-products', adminAuth, logReportAccess('top-products'), reportsController.getTopProductsReport);
router.get('/categories', adminAuth, logReportAccess('categories'), reportsController.getCategoriesReport);
router.get('/trends', adminAuth, logReportAccess('trends'), reportsController.getTrendsReport);
router.get('/sellers', adminAuth, logReportAccess('sellers'), reportsController.getSellersReport);
router.get('/payments', adminAuth, logReportAccess('payments'), reportsController.getPaymentsReport);
router.get('/transactions', adminAuth, logReportAccess('transactions'), reportsController.getTransactionsReport);
router.get('/compare', adminAuth, logReportAccess('compare'), reportsController.getCompareReport);

// ── Phase 4.2 - API Endpoints - Export and Preferences ────────────────────────
router.post('/export-pdf', adminAuth, logPDFDownload('pdf-export'), reportsController.exportPDF);
router.get('/download/:fileName', adminAuth, reportsController.downloadPDF);
router.get('/email-preferences', adminAuth, reportsController.getEmailPreferences);
router.put('/email-preferences', adminAuth, reportsController.updateEmailPreferences);
router.get('/audit-log', adminAuth, reportsController.getAuditLog);

// ── Phase 5.2 - Monitoring and Alerting Endpoints ──────────────────────────
router.get('/monitoring/metrics', adminAuth, reportsController.getMonitoringMetrics);
router.get('/monitoring/report-generation', adminAuth, reportsController.getReportGenerationMetrics);
router.get('/monitoring/email-delivery', adminAuth, reportsController.getEmailDeliveryMetrics);
router.get('/monitoring/cache', adminAuth, reportsController.getCacheStats);
router.get('/monitoring/anomalies', adminAuth, reportsController.getAnomalies);
router.get('/monitoring/alerts', adminAuth, reportsController.getAlertStats);
router.put('/monitoring/alerts/channels', adminAuth, reportsController.configureAlertChannels);
router.post('/monitoring/alerts/register-email', adminAuth, reportsController.registerAlertEmail);
router.delete('/monitoring/alerts/unregister-email', adminAuth, reportsController.unregisterAlertEmail);

module.exports = router;
