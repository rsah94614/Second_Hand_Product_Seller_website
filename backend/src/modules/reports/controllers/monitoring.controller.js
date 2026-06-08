'use strict';

const logger = require('../../../services/logger.service');
const monitoringService = require('../../../services/MonitoringService');
const alertingService = require('../../../services/AlertingService');

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
