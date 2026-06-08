'use strict';

const logger = require('../../../services/logger.service');
const EmailPreference = require('../../../../models/EmailPreference');

/**
 * Phase 4.2 - Get email preferences
 * GET /admin/reports/email-preferences
 */
exports.getEmailPreferences = async (req, res) => {
  try {
    const adminId = req.user._id;

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
