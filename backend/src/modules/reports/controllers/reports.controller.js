'use strict';

const logger = require('../../../services/logger.service');
const emailSchedulerService = require('../../../services/EmailSchedulerService');
const emailDeliveryService = require('../../../services/EmailDeliveryService');
const reportGeneratorService = require('../../../services/ReportGeneratorService');
const pdfExportService = require('../../../services/PDFExportService');
const monitoringService = require('../../../services/MonitoringService');
const alertingService = require('../../../services/AlertingService');

/**
 * Reports Controller
 *
 * Handles admin endpoints for:
 *   - Email scheduler management (start, stop, status, manual trigger)
 *   - Report generation and export
 *   - Email delivery tracking
 *
 * Phase 3.1, 3.2, 3.3 implementation
 */

/**
 * Download a generated PDF report
 * GET /admin/reports/download/:fileName
 */
exports.downloadPDF = async (req, res) => {
  try {
    const { fileName } = req.params;

    // Validate filename to prevent directory traversal
    if (!fileName || fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file name',
      });
    }

    const path = require('path');
    const fs = require('fs');
    const reportsDir = process.env.REPORTS_DIR
      ? path.resolve(process.env.REPORTS_DIR)
      : path.resolve('./reports');

    const filePath = path.join(reportsDir, fileName);

    // Verify the file exists and is within the reports directory
    if (!fs.existsSync(filePath) || !filePath.startsWith(reportsDir)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      logger.error('Error streaming PDF file', { error: err.message, fileName });
      res.status(500).json({
        success: false,
        message: 'Error downloading file',
      });
    });
  } catch (error) {
    logger.error('Error downloading PDF', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to download PDF',
      error: error.message,
    });
  }
};

/**
 * Get email scheduler status
 * GET /admin/reports/scheduler/status
 */
exports.getSchedulerStatus = async (req, res) => {
  try {
    const status = emailSchedulerService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting scheduler status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message,
    });
  }
};

/**
 * Start email scheduler
 * POST /admin/reports/scheduler/start
 */
exports.startScheduler = async (req, res) => {
  try {
    emailSchedulerService.start();
    const status = emailSchedulerService.getStatus();
    res.json({
      success: true,
      message: 'Email scheduler started',
      data: status,
    });
  } catch (error) {
    logger.error('Error starting scheduler', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error.message,
    });
  }
};

/**
 * Stop email scheduler
 * POST /admin/reports/scheduler/stop
 */
exports.stopScheduler = async (req, res) => {
  try {
    emailSchedulerService.stop();
    const status = emailSchedulerService.getStatus();
    res.json({
      success: true,
      message: 'Email scheduler stopped',
      data: status,
    });
  } catch (error) {
    logger.error('Error stopping scheduler', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message,
    });
  }
};

/**
 * Manually trigger email scheduler
 * POST /admin/reports/scheduler/trigger
 */
exports.triggerScheduler = async (req, res) => {
  try {
    const result = await emailSchedulerService.triggerManually();
    res.json({
      success: true,
      message: 'Email scheduler triggered manually',
      data: result,
    });
  } catch (error) {
    logger.error('Error triggering scheduler', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to trigger scheduler',
      error: error.message,
    });
  }
};

/**
 * Get email delivery status
 * GET /admin/reports/email-delivery/:jobId
 */
exports.getEmailDeliveryStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await emailDeliveryService.getEmailDeliveryStatus(jobId);
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting email delivery status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get email delivery status',
      error: error.message,
    });
  }
};

/**
 * Generate and export PDF report
 * POST /admin/reports/export-pdf
 * Body: { reportType, dateRange: { startDate, endDate } }
 */
exports.exportPDF = async (req, res) => {
  const startTime = Date.now();
  try {
    const { reportType, dateRange } = req.body;

    logger.info('PDF export request received', { reportType, dateRange });

    // Validate required fields
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'reportType is required',
      });
    }

    if (!dateRange) {
      return res.status(400).json({
        success: false,
        message: 'dateRange object is required',
      });
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      return res.status(400).json({
        success: false,
        message: 'dateRange.startDate and dateRange.endDate are required',
      });
    }

    // Generate report data based on report type
    let reportData;
    try {
      switch (reportType) {
        case 'dashboard':
          reportData = await reportGeneratorService.getDashboardMetrics(dateRange);
          break;
        case 'top-products':
          reportData = await reportGeneratorService.getTopProducts(dateRange, 10);
          break;
        case 'categories':
          reportData = await reportGeneratorService.getCategoryBreakdown(dateRange);
          break;
        case 'trends':
          reportData = await reportGeneratorService.getSalesTrends(dateRange, 'daily');
          break;
        case 'sellers':
          reportData = await reportGeneratorService.getSellerRankings(dateRange, 'revenue', 50);
          break;
        case 'payments':
          reportData = await reportGeneratorService.getPaymentMetrics(dateRange);
          break;
        case 'transactions':
          reportData = await reportGeneratorService.getTransactionMetrics(dateRange);
          break;
        case 'comparison':
          // For comparison, we need period1 and period2 data
          reportData = await reportGeneratorService.getSalesMetrics(dateRange);
          break;
        default:
          reportData = await reportGeneratorService.getSalesMetrics(dateRange);
      }
    } catch (dataError) {
      logger.error('Error generating report data', { error: dataError.message, reportType });
      return res.status(500).json({
        success: false,
        message: 'Failed to generate report data',
        error: dataError.message,
      });
    }

    // Wrap metrics in the expected structure for PDF generation
    const pdfReportData = {
      metrics: reportData,
      charts: [], // Charts can be added later if needed
    };

    // Generate PDF
    const pdfResult = await pdfExportService.generatePDF(pdfReportData, reportType, dateRange);

    const generationTimeMs = Date.now() - startTime;

    // Track report generation metrics
    monitoringService.trackReportGeneration({
      reportType,
      generationTimeMs,
      status: 'success',
      adminId: req.user._id,
    });

    // Log the PDF download
    const auditLogService = require('../../../services/AuditLogService');
    auditLogService.logPDFDownload({
      adminId: req.user._id,
      reportType,
      dateRange,
      fileSize: pdfResult.fileSize || 0,
      generationTimeMs,
      ipAddress: req.ip || req.connection.remoteAddress || '',
      userAgent: req.get('user-agent') || '',
    }).catch(err => {
      logger.error('Failed to log PDF download', { error: err.message });
    });

    res.json({
      success: true,
      message: 'PDF report generated successfully',
      data: {
        ...pdfResult,
        generationTimeMs,
        downloadUrl: `/api/admin/reports/download/${pdfResult.fileName}`,
      },
    });
  } catch (error) {
    logger.error('Error exporting PDF', { error: error.message });

    // Track failed report generation
    monitoringService.trackReportGeneration({
      reportType: req.body.reportType || 'unknown',
      generationTimeMs: Date.now() - startTime,
      status: 'failure',
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to export PDF',
      error: error.message,
    });
  }
};

/**
 * Get sales metrics for a date range
 * GET /admin/reports/sales-metrics
 * Query: startDate, endDate
 */
exports.getSalesMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getSalesMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting sales metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get sales metrics',
      error: error.message,
    });
  }
};

/**
 * Get payment metrics for a date range
 * GET /admin/reports/payment-metrics
 * Query: startDate, endDate
 */
exports.getPaymentMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getPaymentMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting payment metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get payment metrics',
      error: error.message,
    });
  }
};

/**
 * Get top sellers for a date range
 * GET /admin/reports/top-sellers
 * Query: startDate, endDate, limit
 */
exports.getTopSellers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const sellers = await reportGeneratorService.getTopSellers(dateRange, parseInt(limit, 10));

    res.json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    logger.error('Error getting top sellers', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get top sellers',
      error: error.message,
    });
  }
};

/**
 * Get sales trends for a date range
 * GET /admin/reports/sales-trends
 * Query: startDate, endDate, granularity (daily, weekly, monthly)
 */
exports.getSalesTrends = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'daily' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const trends = await reportGeneratorService.getSalesTrends(dateRange, granularity);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error getting sales trends', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get sales trends',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get dashboard report
 * GET /admin/reports/dashboard
 * Query: startDate, endDate
 */
exports.getDashboardReport = async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getDashboardMetrics(dateRange);

    const generationTimeMs = Date.now() - startTime;

    // Track report generation metrics
    monitoringService.trackReportGeneration({
      reportType: 'dashboard',
      generationTimeMs,
      status: 'success',
      adminId: req.user._id,
    });

    res.json({
      success: true,
      data: metrics,
      generationTimeMs,
    });
  } catch (error) {
    logger.error('Error getting dashboard report', { error: error.message });

    // Track failed report generation
    monitoringService.trackReportGeneration({
      reportType: 'dashboard',
      generationTimeMs: Date.now() - startTime,
      status: 'failure',
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get top products report
 * GET /admin/reports/top-products
 * Query: startDate, endDate, limit, sortBy
 */
exports.getTopProductsReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10, sortBy = 'quantity' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const products = await reportGeneratorService.getTopProducts(dateRange, parseInt(limit, 10), sortBy);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    logger.error('Error getting top products report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get top products report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get categories report
 * GET /admin/reports/categories
 * Query: startDate, endDate
 */
exports.getCategoriesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const categories = await reportGeneratorService.getCategoryBreakdown(dateRange);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error getting categories report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get categories report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get trends report
 * GET /admin/reports/trends
 * Query: startDate, endDate, granularity
 */
exports.getTrendsReport = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'daily' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const trends = await reportGeneratorService.getSalesTrends(dateRange, granularity);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error getting trends report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get trends report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get sellers report
 * GET /admin/reports/sellers
 * Query: startDate, endDate, limit, sortBy
 */
exports.getSellersReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, sortBy = 'revenue' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const sellers = await reportGeneratorService.getSellerRankings(dateRange, sortBy, parseInt(limit, 10));

    res.json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    logger.error('Error getting sellers report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get sellers report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get payments report
 * GET /admin/reports/payments
 * Query: startDate, endDate
 */
exports.getPaymentsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getPaymentMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting payments report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get payments report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get transactions report
 * GET /admin/reports/transactions
 * Query: startDate, endDate, category
 */
exports.getTransactionsReport = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getTransactionMetrics(dateRange, category || null);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting transactions report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get compare report
 * GET /admin/reports/compare
 * Query: period1Start, period1End, period2Start, period2End
 */
exports.getCompareReport = async (req, res) => {
  try {
    const { period1Start, period1End, period2Start, period2End } = req.query;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({
        success: false,
        message: 'period1Start, period1End, period2Start, and period2End query parameters are required',
      });
    }

    const comparison = await reportGeneratorService.comparePeriods(
      new Date(period1Start),
      new Date(period1End),
      new Date(period2Start),
      new Date(period2End)
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    logger.error('Error getting compare report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get compare report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.2 - Get email preferences
 * GET /admin/reports/email-preferences
 */
exports.getEmailPreferences = async (req, res) => {
  try {
    const adminId = req.user._id;
    const EmailPreference = require('../../../models/EmailPreference');

    let preferences = await EmailPreference.findOne({ adminId });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = new EmailPreference({
        adminId,
        email: req.user.email,
        subscribed: true,
        frequency: 'weekly',
      });
      await preferences.save();
    }

    res.json({
      success: true,
      data: {
        adminId: preferences.adminId,
        email: preferences.email,
        subscribed: preferences.subscribed,
        frequency: preferences.frequency,
        lastEmailSent: preferences.lastEmailSent,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error getting email preferences', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get email preferences',
      error: error.message,
    });
  }
};

/**
 * Phase 4.2 - Update email preferences
 * PUT /admin/reports/email-preferences
 * Body: { subscribed, frequency }
 */
exports.updateEmailPreferences = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { subscribed, frequency } = req.body;
    const EmailPreference = require('../../../models/EmailPreference');

    // Validate input
    if (frequency && !['weekly', 'monthly', 'never'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'frequency must be one of: weekly, monthly, never',
      });
    }

    // Find or create preferences
    let preferences = await EmailPreference.findOne({ adminId });

    if (!preferences) {
      preferences = new EmailPreference({
        adminId,
        email: req.user.email,
      });
    }

    // Update fields if provided
    if (subscribed !== undefined) {
      preferences.subscribed = subscribed;
    }
    if (frequency) {
      preferences.frequency = frequency;
    }

    preferences.updatedAt = new Date();
    await preferences.save();

    res.json({
      success: true,
      message: 'Email preferences updated successfully',
      data: {
        adminId: preferences.adminId,
        email: preferences.email,
        subscribed: preferences.subscribed,
        frequency: preferences.frequency,
        lastEmailSent: preferences.lastEmailSent,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error updating email preferences', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update email preferences',
      error: error.message,
    });
  }
};

/**
 * Phase 4.2 - Get audit log
 * GET /admin/reports/audit-log
 * Query: startDate, endDate, action, adminId, limit, offset
 */
exports.getAuditLog = async (req, res) => {
  try {
    const { startDate, endDate, action, adminId, limit = 50, offset = 0 } = req.query;
    const ReportAuditLog = require('../../../models/ReportAuditLog');

    // Build filter
    const filter = {};
    
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    if (action) {
      filter.action = action;
    }
    
    if (adminId) {
      filter.adminId = adminId;
    } else {
      // If no adminId specified, default to current admin
      filter.adminId = req.user._id;
    }

    // Get total count
    const total = await ReportAuditLog.countDocuments(filter);

    // Fetch audit logs with pagination
    const logs = await ReportAuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .skip(parseInt(offset, 10))
      .lean();

    res.json({
      success: true,
      data: {
        logs,
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      },
    });
  } catch (error) {
    logger.error('Error getting audit log', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get audit log',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Get monitoring metrics
 * GET /admin/reports/monitoring/metrics
 */
exports.getMonitoringMetrics = async (req, res) => {
  try {
    const metrics = monitoringService.exportMetrics();

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting monitoring metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get monitoring metrics',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Get report generation metrics
 * GET /admin/reports/monitoring/report-generation
 * Query: reportType, limit
 */
exports.getReportGenerationMetrics = async (req, res) => {
  try {
    const { reportType, limit = 100 } = req.query;

    const metrics = monitoringService.getReportGenerationMetrics({
      reportType,
      limit: parseInt(limit, 10),
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting report generation metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get report generation metrics',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Get email delivery metrics
 * GET /admin/reports/monitoring/email-delivery
 * Query: limit
 */
exports.getEmailDeliveryMetrics = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const metrics = monitoringService.getEmailDeliveryMetrics({
      limit: parseInt(limit, 10),
    });

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting email delivery metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get email delivery metrics',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Get cache statistics
 * GET /admin/reports/monitoring/cache
 */
exports.getCacheStats = async (req, res) => {
  try {
    const stats = monitoringService.getCacheStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting cache stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Get anomalies detected
 * GET /admin/reports/monitoring/anomalies
 * Query: limit
 */
exports.getAnomalies = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const anomalies = monitoringService.getAnomalies({
      limit: parseInt(limit, 10),
    });

    res.json({
      success: true,
      data: {
        anomalies,
        count: anomalies.length,
      },
    });
  } catch (error) {
    logger.error('Error getting anomalies', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get anomalies',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Get alert statistics
 * GET /admin/reports/monitoring/alerts
 */
exports.getAlertStats = async (req, res) => {
  try {
    const stats = alertingService.getAlertStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting alert stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get alert stats',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Configure alert channels
 * PUT /admin/reports/monitoring/alerts/channels
 * Body: { channel, enabled }
 */
exports.configureAlertChannels = async (req, res) => {
  try {
    const { channel, enabled } = req.body;

    if (!channel || enabled === undefined) {
      return res.status(400).json({
        success: false,
        message: 'channel and enabled are required',
      });
    }

    alertingService.setChannelEnabled(channel, enabled);

    res.json({
      success: true,
      message: `Alert channel ${channel} ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch (error) {
    logger.error('Error configuring alert channels', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to configure alert channels',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Register admin email for alerts
 * POST /admin/reports/monitoring/alerts/register-email
 * Body: { email }
 */
exports.registerAlertEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email is required',
      });
    }

    alertingService.registerAdminEmail(email);

    res.json({
      success: true,
      message: `Email ${email} registered for alerts`,
    });
  } catch (error) {
    logger.error('Error registering alert email', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to register alert email',
      error: error.message,
    });
  }
};

/**
 * Phase 5.2 - Unregister admin email from alerts
 * DELETE /admin/reports/monitoring/alerts/unregister-email
 * Body: { email }
 */
exports.unregisterAlertEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'email is required',
      });
    }

    alertingService.unregisterAdminEmail(email);

    res.json({
      success: true,
      message: `Email ${email} unregistered from alerts`,
    });
  } catch (error) {
    logger.error('Error unregistering alert email', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to unregister alert email',
      error: error.message,
    });
  }
};
