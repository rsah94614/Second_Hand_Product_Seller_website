'use strict';

const auditLogService = require('../../services/AuditLogService');
const logger = require('../../services/logger.service');

/**
 * Audit Logging Middleware
 * 
 * Automatically logs report access, downloads, and email operations.
 * Attaches audit logging context to request for use in controllers.
 * 
 * **Validates: Requirements 15, 19 (Access control, monitoring)**
 */

/**
 * Middleware to log report access
 * Logs when admin views a report
 */
const logReportAccess = (reportType) => async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Log the access asynchronously (don't block the request)
    if (req.user && startDate && endDate) {
      auditLogService.logReportAccess({
        adminId: req.user._id,
        reportType,
        dateRange: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        ipAddress: req.ip || req.connection.remoteAddress || '',
        userAgent: req.get('user-agent') || '',
      }).catch(err => {
        logger.error('Failed to log report access', { error: err.message });
      });
    }

    next();
  } catch (error) {
    logger.error('Error in audit log middleware', { error: error.message });
    // Don't block the request if audit logging fails
    next();
  }
};

/**
 * Middleware to log PDF downloads
 * Logs when admin downloads a PDF report
 */
const logPDFDownload = (reportType) => async (req, res, next) => {
  try {
    // Attach logging function to response
    const originalJson = res.json;
    res.json = function(data) {
      // Log the download asynchronously
      if (req.user && data.success && data.data) {
        const { startDate, endDate } = req.body;
        auditLogService.logPDFDownload({
          adminId: req.user._id,
          reportType,
          dateRange: {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
          fileSize: data.data.fileSize || 0,
          generationTimeMs: data.data.generationTimeMs || 0,
          ipAddress: req.ip || req.connection.remoteAddress || '',
          userAgent: req.get('user-agent') || '',
        }).catch(err => {
          logger.error('Failed to log PDF download', { error: err.message });
        });
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Error in PDF audit log middleware', { error: error.message });
    next();
  }
};

/**
 * Middleware to log email delivery
 * Logs when admin triggers email delivery
 */
const logEmailDelivery = (reportType) => async (req, res, next) => {
  try {
    // Attach logging function to response
    const originalJson = res.json;
    res.json = function(data) {
      // Log the email delivery asynchronously
      if (req.user && data.success) {
        const { startDate, endDate } = req.body || req.query;
        auditLogService.logEmailDelivery({
          adminId: req.user._id,
          reportType,
          dateRange: {
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
          ipAddress: req.ip || req.connection.remoteAddress || '',
          userAgent: req.get('user-agent') || '',
        }).catch(err => {
          logger.error('Failed to log email delivery', { error: err.message });
        });
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Error in email audit log middleware', { error: error.message });
    next();
  }
};

module.exports = {
  logReportAccess,
  logPDFDownload,
  logEmailDelivery,
};
