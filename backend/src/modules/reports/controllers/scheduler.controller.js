'use strict';

const logger = require('../../../services/logger.service');
const emailSchedulerService = require('../../../services/EmailSchedulerService');
const emailDeliveryService = require('../../../services/EmailDeliveryService');

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
