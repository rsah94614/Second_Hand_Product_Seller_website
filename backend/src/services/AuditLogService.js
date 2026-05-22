'use strict';

const ReportAuditLog = require('../../models/ReportAuditLog');
const logger = require('./logger.service');

/**
 * AuditLogService
 * 
 * Handles audit logging for all report operations including:
 * - Report access/viewing
 * - PDF downloads
 * - Email delivery
 * - Email failures
 * 
 * **Validates: Requirements 15, 19 (Access control, monitoring)**
 */
class AuditLogService {
  /**
   * Log report access
   * 
   * @param {Object} params - Logging parameters
   * @param {string} params.adminId - Admin user ID
   * @param {string} params.reportType - Type of report accessed
   * @param {Object} params.dateRange - Date range of report
   * @param {Date} params.dateRange.startDate - Start date
   * @param {Date} params.dateRange.endDate - End date
   * @param {string} params.ipAddress - IP address of requester
   * @param {string} params.userAgent - User agent string
   * @returns {Promise<Object>} Created audit log entry
   */
  async logReportAccess(params) {
    try {
      const {
        adminId,
        reportType,
        dateRange,
        ipAddress = '',
        userAgent = '',
      } = params;

      const auditLog = new ReportAuditLog({
        adminId,
        action: 'view',
        reportType,
        dateRange,
        details: {
          ipAddress,
          userAgent,
          status: 'success',
        },
        timestamp: new Date(),
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Error logging report access', { error: error.message });
      // Don't throw - audit logging should not break the main operation
      return null;
    }
  }

  /**
   * Log PDF download
   * 
   * @param {Object} params - Logging parameters
   * @param {string} params.adminId - Admin user ID
   * @param {string} params.reportType - Type of report
   * @param {Object} params.dateRange - Date range of report
   * @param {Date} params.dateRange.startDate - Start date
   * @param {Date} params.dateRange.endDate - End date
   * @param {number} params.fileSize - Size of PDF file in bytes
   * @param {number} params.generationTimeMs - Time taken to generate PDF
   * @param {string} params.ipAddress - IP address of requester
   * @param {string} params.userAgent - User agent string
   * @returns {Promise<Object>} Created audit log entry
   */
  async logPDFDownload(params) {
    try {
      const {
        adminId,
        reportType,
        dateRange,
        fileSize = 0,
        generationTimeMs = 0,
        ipAddress = '',
        userAgent = '',
      } = params;

      const auditLog = new ReportAuditLog({
        adminId,
        action: 'download',
        reportType,
        dateRange,
        details: {
          ipAddress,
          userAgent,
          downloadFormat: 'pdf',
          fileSize,
          generationTimeMs,
          status: 'success',
        },
        timestamp: new Date(),
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Error logging PDF download', { error: error.message });
      return null;
    }
  }

  /**
   * Log email delivery
   * 
   * @param {Object} params - Logging parameters
   * @param {string} params.adminId - Admin user ID
   * @param {string} params.reportType - Type of report
   * @param {Object} params.dateRange - Date range of report
   * @param {Date} params.dateRange.startDate - Start date
   * @param {Date} params.dateRange.endDate - End date
   * @param {string} params.ipAddress - IP address of requester
   * @param {string} params.userAgent - User agent string
   * @returns {Promise<Object>} Created audit log entry
   */
  async logEmailDelivery(params) {
    try {
      const {
        adminId,
        reportType,
        dateRange,
        ipAddress = '',
        userAgent = '',
      } = params;

      const auditLog = new ReportAuditLog({
        adminId,
        action: 'email_sent',
        reportType,
        dateRange,
        details: {
          ipAddress,
          userAgent,
          downloadFormat: 'email',
          status: 'success',
        },
        timestamp: new Date(),
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Error logging email delivery', { error: error.message });
      return null;
    }
  }

  /**
   * Log email delivery failure
   * 
   * @param {Object} params - Logging parameters
   * @param {string} params.adminId - Admin user ID
   * @param {string} params.reportType - Type of report
   * @param {Object} params.dateRange - Date range of report
   * @param {Date} params.dateRange.startDate - Start date
   * @param {Date} params.dateRange.endDate - End date
   * @param {string} params.errorMessage - Error message
   * @param {string} params.ipAddress - IP address of requester
   * @param {string} params.userAgent - User agent string
   * @returns {Promise<Object>} Created audit log entry
   */
  async logEmailFailure(params) {
    try {
      const {
        adminId,
        reportType,
        dateRange,
        errorMessage = '',
        ipAddress = '',
        userAgent = '',
      } = params;

      const auditLog = new ReportAuditLog({
        adminId,
        action: 'email_failed',
        reportType,
        dateRange,
        details: {
          ipAddress,
          userAgent,
          downloadFormat: 'email',
          status: 'failure',
          errorMessage,
        },
        timestamp: new Date(),
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      logger.error('Error logging email failure', { error: error.message });
      return null;
    }
  }

  /**
   * Get audit logs with filtering
   * 
   * @param {Object} params - Query parameters
   * @param {string} params.adminId - Filter by admin ID
   * @param {string} params.action - Filter by action type
   * @param {string} params.reportType - Filter by report type
   * @param {Date} params.startDate - Filter by start date
   * @param {Date} params.endDate - Filter by end date
   * @param {number} params.limit - Number of records to return
   * @param {number} params.offset - Number of records to skip
   * @returns {Promise<Object>} Audit logs and metadata
   */
  async getAuditLogs(params) {
    try {
      const {
        adminId,
        action,
        reportType,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = params;

      // Build filter
      const filter = {};

      if (adminId) {
        filter.adminId = adminId;
      }

      if (action) {
        filter.action = action;
      }

      if (reportType) {
        filter.reportType = reportType;
      }

      if (startDate && endDate) {
        filter.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Get total count
      const total = await ReportAuditLog.countDocuments(filter);

      // Fetch logs
      const logs = await ReportAuditLog.find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit, 10))
        .skip(parseInt(offset, 10))
        .lean();

      return {
        logs,
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      };
    } catch (error) {
      logger.error('Error getting audit logs', { error: error.message });
      throw error;
    }
  }

  /**
   * Get audit log statistics
   * 
   * @param {Object} params - Query parameters
   * @param {string} params.adminId - Filter by admin ID
   * @param {Date} params.startDate - Filter by start date
   * @param {Date} params.endDate - Filter by end date
   * @returns {Promise<Object>} Statistics
   */
  async getAuditStats(params) {
    try {
      const {
        adminId,
        startDate,
        endDate,
      } = params;

      // Build filter
      const filter = {};

      if (adminId) {
        filter.adminId = adminId;
      }

      if (startDate && endDate) {
        filter.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Get statistics
      const stats = await ReportAuditLog.aggregate([
        { $match: filter },
        {
          $facet: {
            byAction: [
              { $group: { _id: '$action', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            byReportType: [
              { $group: { _id: '$reportType', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            byStatus: [
              { $group: { _id: '$details.status', count: { $sum: 1 } } },
            ],
            totalCount: [
              { $count: 'count' },
            ],
          },
        },
      ]);

      return stats[0];
    } catch (error) {
      logger.error('Error getting audit stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AuditLogService();
