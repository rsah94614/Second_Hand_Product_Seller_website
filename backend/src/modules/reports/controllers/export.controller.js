'use strict';

const path = require('path');
const fs = require('fs');
const logger = require('../../../services/logger.service');
const reportGeneratorService = require('../../../services/ReportGeneratorService');
const pdfExportService = require('../../../services/PDFExportService');
const monitoringService = require('../../../services/MonitoringService');
const auditLogService = require('../../../services/AuditLogService');

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
