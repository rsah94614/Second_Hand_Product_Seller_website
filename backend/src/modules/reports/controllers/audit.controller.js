'use strict';

const logger = require('../../../services/logger.service');
const ReportAuditLog = require('../../../../models/ReportAuditLog');

/**
 * Phase 4.2 - Get audit log
 * GET /admin/reports/audit-log
 * Query: startDate, endDate, action, adminId, limit, offset
 */
exports.getAuditLog = async (req, res) => {
  try {
    const { startDate, endDate, action, adminId, limit = 50, offset = 0 } = req.query;

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
