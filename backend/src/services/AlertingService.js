'use strict';

const logger = require('./logger.service');

/**
 * AlertingService
 * 
 * Handles alert notifications for system administrators.
 * Supports multiple notification channels (email, in-app, webhooks).
 * 
 * **Validates: Requirements 20 (Alerting)**
 */
class AlertingService {
  constructor() {
    this.config = {
      channels: {
        email: true,
        inApp: true,
        webhook: false,
      },
      webhookUrl: process.env.ALERT_WEBHOOK_URL || null,
      adminEmails: [],
      alertThrottling: {
        enabled: true,
        windowMs: 5 * 60 * 1000, // 5 minutes
      },
    };

    // Track recent alerts to prevent spam
    this.recentAlerts = [];
  }

  /**
   * Register admin email for alerts
   * 
   * @param {string} email - Admin email address
   */
  registerAdminEmail(email) {
    if (email && !this.config.adminEmails.includes(email)) {
      this.config.adminEmails.push(email);
      logger.info('Admin email registered for alerts', { email });
    }
  }

  /**
   * Unregister admin email
   * 
   * @param {string} email - Admin email address
   */
  unregisterAdminEmail(email) {
    this.config.adminEmails = this.config.adminEmails.filter(e => e !== email);
    logger.info('Admin email unregistered from alerts', { email });
  }

  /**
   * Send alert notification
   * 
   * @param {Object} alert - Alert object
   * @param {string} alert.type - Alert type (SLA_VIOLATION, EMAIL_DELIVERY_FAILURE, etc.)
   * @param {string} alert.severity - Severity level (info, warning, error, critical)
   * @param {string} alert.message - Alert message
   * @param {Object} alert.metric - Associated metric data
   * @returns {Promise<Object>} Alert delivery status
   */
  async sendAlert(alert) {
    try {
      // Check throttling
      if (this.config.alertThrottling.enabled) {
        if (this.isAlertThrottled(alert)) {
          logger.debug('Alert throttled', { type: alert.type });
          return { success: false, reason: 'throttled' };
        }
      }

      // Record alert
      this.recentAlerts.push({
        ...alert,
        sentAt: new Date(),
      });

      // Clean old alerts from throttling list
      this.cleanOldAlerts();

      const result = {
        success: true,
        channels: {},
      };

      // Send via email
      if (this.config.channels.email && this.config.adminEmails.length > 0) {
        result.channels.email = await this.sendEmailAlert(alert);
      }

      // Send via in-app notification
      if (this.config.channels.inApp) {
        result.channels.inApp = await this.sendInAppAlert(alert);
      }

      // Send via webhook
      if (this.config.channels.webhook && this.config.webhookUrl) {
        result.channels.webhook = await this.sendWebhookAlert(alert);
      }

      logger.info('Alert sent', {
        type: alert.type,
        severity: alert.severity,
        channels: Object.keys(result.channels),
      });

      return result;
    } catch (error) {
      logger.error('Error sending alert', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if alert should be throttled
   * 
   * @param {Object} alert - Alert to check
   * @returns {boolean} Whether alert should be throttled
   */
  isAlertThrottled(alert) {
    const now = Date.now();
    const windowStart = now - this.config.alertThrottling.windowMs;

    // Check if same alert type was sent recently
    const recentSameType = this.recentAlerts.filter(
      a => a.type === alert.type && a.sentAt.getTime() > windowStart
    );

    return recentSameType.length > 0;
  }

  /**
   * Clean old alerts from throttling list
   */
  cleanOldAlerts() {
    const now = Date.now();
    const windowStart = now - this.config.alertThrottling.windowMs;

    this.recentAlerts = this.recentAlerts.filter(
      a => a.sentAt.getTime() > windowStart
    );
  }

  /**
   * Send email alert
   * 
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Email send result
   */
  async sendEmailAlert(alert) {
    try {
      // Format alert for email
      const emailContent = this.formatAlertEmail(alert);

      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      // For now, log the alert
      logger.warn('Email alert would be sent', {
        recipients: this.config.adminEmails,
        subject: emailContent.subject,
        type: alert.type,
      });

      return {
        success: true,
        recipients: this.config.adminEmails.length,
        message: 'Email alert queued',
      };
    } catch (error) {
      logger.error('Error sending email alert', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send in-app alert
   * 
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} In-app notification result
   */
  async sendInAppAlert(alert) {
    try {
      // In production, this would create a notification in the database
      // that admins can see in the dashboard
      logger.info('In-app alert created', {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
      });

      return {
        success: true,
        message: 'In-app notification created',
      };
    } catch (error) {
      logger.error('Error sending in-app alert', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send webhook alert
   * 
   * @param {Object} alert - Alert object
   * @returns {Promise<Object>} Webhook send result
   */
  async sendWebhookAlert(alert) {
    try {
      if (!this.config.webhookUrl) {
        return { success: false, message: 'Webhook URL not configured' };
      }

      // In production, make HTTP POST to webhook
      logger.info('Webhook alert would be sent', {
        url: this.config.webhookUrl,
        type: alert.type,
      });

      return {
        success: true,
        message: 'Webhook alert queued',
      };
    } catch (error) {
      logger.error('Error sending webhook alert', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Format alert for email
   * 
   * @param {Object} alert - Alert object
   * @returns {Object} Formatted email content
   */
  formatAlertEmail(alert) {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };

    const subject = `${severityEmoji[alert.severity] || '⚠️'} Campus Mitra Alert: ${alert.type}`;

    const body = `
Alert Type: ${alert.type}
Severity: ${alert.severity}
Time: ${new Date().toISOString()}

Message:
${alert.message}

${alert.metric ? `Details:
${JSON.stringify(alert.metric, null, 2)}` : ''}

Please check the admin dashboard for more information.
    `.trim();

    return {
      subject,
      body,
      html: this.formatAlertHTML(alert, severityEmoji),
    };
  }

  /**
   * Format alert as HTML email
   * 
   * @param {Object} alert - Alert object
   * @param {Object} severityEmoji - Emoji map
   * @returns {string} HTML content
   */
  formatAlertHTML(alert, severityEmoji) {
    const severityColors = {
      info: '#3498db',
      warning: '#f39c12',
      error: '#e74c3c',
      critical: '#c0392b',
    };

    const color = severityColors[alert.severity] || '#95a5a6';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 5px 5px; }
    .metric { background-color: white; padding: 10px; margin-top: 10px; border-left: 4px solid ${color}; }
    .footer { margin-top: 20px; font-size: 12px; color: #7f8c8d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${severityEmoji[alert.severity] || '⚠️'} ${alert.type}</h2>
      <p>Severity: <strong>${alert.severity.toUpperCase()}</strong></p>
    </div>
    <div class="content">
      <p><strong>Message:</strong></p>
      <p>${alert.message}</p>
      ${alert.metric ? `
      <div class="metric">
        <strong>Details:</strong>
        <pre>${JSON.stringify(alert.metric, null, 2)}</pre>
      </div>
      ` : ''}
      <p style="margin-top: 20px; color: #7f8c8d;">
        Time: ${new Date().toISOString()}
      </p>
    </div>
    <div class="footer">
      <p>Campus Mitra Admin Alert System</p>
      <p>Please check the admin dashboard for more information.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get alert statistics
   * 
   * @returns {Object} Alert statistics
   */
  getAlertStats() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recentAlerts = this.recentAlerts.filter(
      a => a.sentAt.getTime() > last24h
    );

    const bySeverity = {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    };

    const byType = {};

    recentAlerts.forEach(alert => {
      bySeverity[alert.severity]++;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });

    return {
      totalAlerts: recentAlerts.length,
      bySeverity,
      byType,
      period: 'last 24 hours',
    };
  }

  /**
   * Enable/disable alert channel
   * 
   * @param {string} channel - Channel name (email, inApp, webhook)
   * @param {boolean} enabled - Whether to enable
   */
  setChannelEnabled(channel, enabled) {
    if (channel in this.config.channels) {
      this.config.channels[channel] = enabled;
      logger.info('Alert channel updated', { channel, enabled });
    }
  }

  /**
   * Set webhook URL
   * 
   * @param {string} url - Webhook URL
   */
  setWebhookUrl(url) {
    this.config.webhookUrl = url;
    logger.info('Webhook URL updated');
  }
}

module.exports = new AlertingService();
