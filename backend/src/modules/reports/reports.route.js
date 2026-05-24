const express = require('express');
const { adminAuth } = require('../../shared/middleware/auth.middleware');
const { logReportAccess, logPDFDownload } = require('../../shared/middleware/auditLog.middleware');

const schedulerController = require('./controllers/scheduler.controller');
const exportController = require('./controllers/export.controller');
const retrievalController = require('./controllers/retrieval.controller');
const preferencesController = require('./controllers/preferences.controller');
const auditController = require('./controllers/audit.controller');
const monitoringController = require('./controllers/monitoring.controller');

const router = express.Router();

// ── Phase 3.1, 3.2, 3.3 - Email Scheduler & Reports ──────────────────────────
router.get('/scheduler/status', adminAuth, schedulerController.getSchedulerStatus);
router.post('/scheduler/start', adminAuth, schedulerController.startScheduler);
router.post('/scheduler/stop', adminAuth, schedulerController.stopScheduler);
router.post('/scheduler/trigger', adminAuth, schedulerController.triggerScheduler);
router.get('/email-delivery/:jobId', adminAuth, schedulerController.getEmailDeliveryStatus);
router.post('/export-pdf', adminAuth, exportController.exportPDF);
router.get('/sales-metrics', adminAuth, retrievalController.getSalesMetrics);
router.get('/payment-metrics', adminAuth, retrievalController.getPaymentMetrics);
router.get('/top-sellers', adminAuth, retrievalController.getTopSellers);
router.get('/sales-trends', adminAuth, retrievalController.getSalesTrends);

// ── Phase 4.1 - API Endpoints - Report Retrieval ──────────────────────────────
router.get('/dashboard', adminAuth, logReportAccess('dashboard'), retrievalController.getDashboardReport);
router.get('/top-products', adminAuth, logReportAccess('top-products'), retrievalController.getTopProductsReport);
router.get('/categories', adminAuth, logReportAccess('categories'), retrievalController.getCategoriesReport);
router.get('/trends', adminAuth, logReportAccess('trends'), retrievalController.getTrendsReport);
router.get('/sellers', adminAuth, logReportAccess('sellers'), retrievalController.getSellersReport);
router.get('/payments', adminAuth, logReportAccess('payments'), retrievalController.getPaymentsReport);
router.get('/transactions', adminAuth, logReportAccess('transactions'), retrievalController.getTransactionsReport);
router.get('/compare', adminAuth, logReportAccess('compare'), retrievalController.getCompareReport);

// ── Phase 4.2 - API Endpoints - Export and Preferences ────────────────────────
router.post('/export-pdf', adminAuth, logPDFDownload('pdf-export'), exportController.exportPDF);
router.get('/download/:fileName', adminAuth, exportController.downloadPDF);
router.get('/email-preferences', adminAuth, preferencesController.getEmailPreferences);
router.put('/email-preferences', adminAuth, preferencesController.updateEmailPreferences);
router.get('/audit-log', adminAuth, auditController.getAuditLog);

// ── Phase 5.2 - Monitoring and Alerting Endpoints ──────────────────────────
router.get('/monitoring/metrics', adminAuth, monitoringController.getMonitoringMetrics);
router.get('/monitoring/report-generation', adminAuth, monitoringController.getReportGenerationMetrics);
router.get('/monitoring/email-delivery', adminAuth, monitoringController.getEmailDeliveryMetrics);
router.get('/monitoring/cache', adminAuth, monitoringController.getCacheStats);
router.get('/monitoring/anomalies', adminAuth, monitoringController.getAnomalies);
router.get('/monitoring/alerts', adminAuth, monitoringController.getAlertStats);
router.put('/monitoring/alerts/channels', adminAuth, monitoringController.configureAlertChannels);
router.post('/monitoring/alerts/register-email', adminAuth, monitoringController.registerAlertEmail);
router.delete('/monitoring/alerts/unregister-email', adminAuth, monitoringController.unregisterAlertEmail);

module.exports = router;
