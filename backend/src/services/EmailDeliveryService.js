'use strict';
const nodemailer = require('nodemailer');
const logger = require('./logger.service');
// Lazy-load optional Bull queue
let Queue = null;
/**
 * EmailDeliveryService
 *
 * Sends weekly sales report emails to subscribed admins.
 * Features:
 *   - Full HTML email template with metrics, top products, and footer
 *   - Bull queue with exponential backoff retry (5 min, 30 min, 2 hours)
 *   - Email preference validation (skips unsubscribed admins)
 *   - Delivery logging to EmailDeliveryLog collection
 *
 * Environment variables:
 *   EMAIL_HOST        - SMTP host (default: smtp.gmail.com)
 *   EMAIL_PORT        - SMTP port (default: 587)
 *   EMAIL_USER        - SMTP username
 *   EMAIL_PASS        - SMTP password
 *   EMAIL_FROM        - Sender address (default: noreply@campusmitra.in)
 *   FRONTEND_URL      - Base URL for dashboard/unsubscribe links
 *   REDIS_URL         - Redis connection URL for Bull queue
 *
 * Validates: Requirements 9, 15, 17, 19 (Email delivery, preferences, retry, logging)
 */
class EmailDeliveryService {
  constructor() {
    this.transporter = null;
    this.emailQueue = null;
    /** Retry configuration matching Bull exponential backoff */
    this.retryConfig = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 300000, // 5 min base → 5 min, 30 min, ~2 hours
      },
    };
    this._initTransporter();
    this._initQueue();
  }
  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  /**
   * Send a weekly summary email to a single admin.
   *
   * Before sending, validates the admin's email preference.
   * Logs the delivery attempt to EmailDeliveryLog.
   *
   * @param {string} adminEmail  - Recipient email address
   * @param {Object} reportData  - Aggregated report data (metrics, topProducts, etc.)
   * @param {Object} [options]   - Optional overrides
   * @param {string} [options.adminId]   - Admin ObjectId (for logging)
   * @param {string} [options.jobId]     - Bull job ID (for logging)
   * @param {Object} [options.dateRange] - { startDate, endDate }
   * @returns {Promise<{messageId: string, status: string, timestamp: Date}>}
   */
  async sendWeeklyEmail(adminEmail, reportData, options = {}) {
    const { adminId, jobId = `manual_${Date.now()}`, dateRange = {} } = options;
    // --- Email preference validation ---
    if (adminId) {
      const shouldSkip = await this._checkOptOut(adminId);
      if (shouldSkip) {
        logger.info('EmailDeliveryService: skipping unsubscribed admin', { adminId, adminEmail });
        await this._logDelivery({
          jobId,
          adminId,
          email: adminEmail,
          status: 'skipped',
          dateRange,
        });
        return { messageId: null, status: 'skipped', timestamp: new Date() };
      }
    }
    // --- Build and send email ---
    const html = this.renderEmailTemplate(reportData, { adminEmail, dateRange });
    const subject = this._buildSubject(dateRange);
    let messageId;
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Campus Mitra <noreply@campusmitra.in>',
        to: adminEmail,
        subject,
        html,
      });
      messageId = info.messageId;
      logger.info('EmailDeliveryService: email sent', { adminEmail, messageId });

      // Track email delivery success in monitoring
      try {
        const monitoringService = require('./MonitoringService');
        monitoringService.trackEmailDelivery({
          adminId,
          status: 'sent',
          errorMessage: '',
          attemptNumber: 1,
        });
      } catch (_) {
        // Monitoring service may not be available
      }

      await this._logDelivery({
        jobId,
        adminId,
        email: adminEmail,
        status: 'sent',
        messageId,
        dateRange,
      });
      // Update lastEmailSent in EmailPreference
      if (adminId) {
        await this._updateLastEmailSent(adminId);
      }
      return { messageId, status: 'sent', timestamp: new Date() };
    } catch (err) {
      logger.error('EmailDeliveryService: send failed', { adminEmail, error: err.message });

      // Track email delivery failure in monitoring
      try {
        const monitoringService = require('./MonitoringService');
        monitoringService.trackEmailDelivery({
          adminId,
          status: 'failed',
          errorMessage: err.message,
          attemptNumber: 1,
        });
      } catch (_) {
        // Monitoring service may not be available
      }

      await this._logDelivery({
        jobId,
        adminId,
        email: adminEmail,
        status: 'failed',
        errorMessage: err.message,
        dateRange,
      });
      throw err;
    }
  }
  /**
   * Schedule a weekly email job via Bull queue.
   * The job will be retried up to 3 times with exponential backoff.
   *
   * @param {string} adminEmail
   * @param {Object} reportData
   * @param {Object} [options]
   * @returns {Promise<Object>} Bull job instance
   */
  async scheduleWeeklyReport(adminEmail, reportData, options = {}) {
    if (!this.emailQueue) {
      // Fallback: send directly if Bull is unavailable
      logger.warn('EmailDeliveryService: Bull queue unavailable, sending directly');
      return this.sendWeeklyEmail(adminEmail, reportData, options);
    }
    const job = await this.emailQueue.add(
      { adminEmail, reportData, options },
      this.retryConfig
    );
    logger.info('EmailDeliveryService: job queued', { jobId: job.id, adminEmail });
    return job;
  }
  /**
   * Render the full HTML email template.
   *
   * Sections:
   *   1. Header  – logo / title / date range
   *   2. Summary metrics table (revenue, orders, AOV, WoW change)
   *   3. Top 5 products table
   *   4. Top 5 sellers table
   *   5. Top 5 categories table
   *   6. Footer with dashboard link and unsubscribe link
   *
   * @param {Object} reportData  - Report payload from ReportGeneratorService
   * @param {Object} [ctx]       - Context: { adminEmail, dateRange }
   * @returns {string} HTML string
   */
  renderEmailTemplate(reportData, ctx = {}) {
    const { dateRange = {} } = ctx;
    const frontendUrl = process.env.FRONTEND_URL || 'https://campusmitra.in';
    const fmtDate = (d) => {
      if (!d) return 'N/A';
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const fmtCurrency = (n) => {
      if (n === null || n === undefined) return '₹0.00';
      return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const fmtNum = (n) => (n === null || n === undefined ? '0' : Number(n).toLocaleString('en-IN'));
    const fmtPct = (n) => {
      if (n === null || n === undefined) return '0.00%';
      const sign = n > 0 ? '+' : '';
      return `${sign}${Number(n).toFixed(2)}%`;
    };
    // Extract data with safe defaults
    const metrics = reportData.metrics || reportData || {};
    const topProducts = (reportData.topProducts || []).slice(0, 5);
    const topSellers = (reportData.topSellers || []).slice(0, 5);
    const categories = (reportData.categoryBreakdown || reportData.categories || []).slice(0, 5);
    const weekStart = fmtDate(dateRange.startDate);
    const weekEnd = fmtDate(dateRange.endDate);
    // Build unsubscribe URL (token-based if available)
    const unsubToken = metrics.unsubscribeToken || '';
    const unsubUrl = unsubToken
      ? `${frontendUrl}/unsubscribe?token=${encodeURIComponent(unsubToken)}`
      : `${frontendUrl}/settings/email-preferences`;
    const dashboardUrl = `${frontendUrl}/admin/reports`;
    // --- Top Products rows ---
    const productRows = topProducts.length
      ? topProducts
          .map(
            (p, i) => `
          <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0">${this._esc(p.title || p.name || 'Unknown')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${fmtNum(p.quantitySold || p.quantity || 0)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:right">${fmtCurrency(p.revenue || p.totalRevenue || 0)}</td>
          </tr>`
          )
          .join('')
      : '<tr><td colspan="3" style="padding:12px;text-align:center;color:#888">No data available</td></tr>';
    // --- Top Sellers rows ---
    const sellerRows = topSellers.length
      ? topSellers
          .map(
            (s, i) => `
          <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0">${this._esc(s.sellerName || s.name || 'Unknown')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:right">${fmtCurrency(s.totalRevenue || s.revenue || 0)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${fmtNum(s.completedOrders || s.orders || 0)}</td>
          </tr>`
          )
          .join('')
      : '<tr><td colspan="3" style="padding:12px;text-align:center;color:#888">No data available</td></tr>';
    // --- Category rows ---
    const categoryRows = categories.length
      ? categories
          .map(
            (c, i) => `
          <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0">${this._esc(c.category || c.name || 'Unknown')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:right">${fmtCurrency(c.revenue || 0)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;text-align:center">${fmtPct(c.percentOfTotal || c.percentage || 0)}</td>
          </tr>`
          )
          .join('')
      : '<tr><td colspan="3" style="padding:12px;text-align:center;color:#888">No data available</td></tr>';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Mitra Weekly Sales Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#333">
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <!-- ===== HEADER ===== -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a73e8 0%,#0d47a1 100%);padding:32px 40px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px">
                📊 Campus Mitra
              </h1>
              <p style="margin:8px 0 0;color:#bbdefb;font-size:16px">Weekly Sales Report</p>
              <p style="margin:6px 0 0;color:#e3f2fd;font-size:13px">
                ${weekStart} &ndash; ${weekEnd}
              </p>
            </td>
          </tr>
          <!-- ===== SUMMARY METRICS ===== -->
          <tr>
            <td style="padding:32px 40px 16px">
              <h2 style="margin:0 0 16px;font-size:18px;color:#1a73e8;border-bottom:2px solid #e8f0fe;padding-bottom:8px">
                Key Metrics
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                <tr style="background:#e8f0fe">
                  <th style="padding:10px 12px;text-align:left;font-size:13px;color:#555;font-weight:600">Metric</th>
                  <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;font-weight:600">Value</th>
                </tr>
                <tr style="background:#f9f9f9">
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">Total Revenue</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">${fmtCurrency(metrics.totalRevenue)}</td>
                </tr>
                <tr style="background:#ffffff">
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">Sales Volume (Orders)</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">${fmtNum(metrics.salesVolume || metrics.totalOrders)}</td>
                </tr>
                <tr style="background:#f9f9f9">
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">Average Order Value</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600">${fmtCurrency(metrics.avgOrderValue)}</td>
                </tr>
                <tr style="background:#ffffff">
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0">Week-over-Week Change</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0e0e0;text-align:right;font-weight:600;color:${(metrics.weekOverWeekChange || 0) >= 0 ? '#2e7d32' : '#c62828'}">${fmtPct(metrics.weekOverWeekChange)}</td>
                </tr>
                <tr style="background:#f9f9f9">
                  <td style="padding:10px 12px">Payment Success Rate</td>
                  <td style="padding:10px 12px;text-align:right;font-weight:600">${fmtPct(metrics.paymentSuccessRate || metrics.successRate)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- ===== TOP 5 PRODUCTS ===== -->
          <tr>
            <td style="padding:16px 40px">
              <h2 style="margin:0 0 16px;font-size:18px;color:#1a73e8;border-bottom:2px solid #e8f0fe;padding-bottom:8px">
                Top 5 Products
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                <tr style="background:#e8f0fe">
                  <th style="padding:10px 12px;text-align:left;font-size:13px;color:#555;font-weight:600">Product</th>
                  <th style="padding:10px 12px;text-align:center;font-size:13px;color:#555;font-weight:600">Qty Sold</th>
                  <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;font-weight:600">Revenue</th>
                </tr>
                ${productRows}
              </table>
            </td>
          </tr>
          <!-- ===== TOP 5 SELLERS ===== -->
          <tr>
            <td style="padding:16px 40px">
              <h2 style="margin:0 0 16px;font-size:18px;color:#1a73e8;border-bottom:2px solid #e8f0fe;padding-bottom:8px">
                Top 5 Sellers
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                <tr style="background:#e8f0fe">
                  <th style="padding:10px 12px;text-align:left;font-size:13px;color:#555;font-weight:600">Seller</th>
                  <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;font-weight:600">Revenue</th>
                  <th style="padding:10px 12px;text-align:center;font-size:13px;color:#555;font-weight:600">Orders</th>
                </tr>
                ${sellerRows}
              </table>
            </td>
          </tr>
          <!-- ===== TOP 5 CATEGORIES ===== -->
          <tr>
            <td style="padding:16px 40px">
              <h2 style="margin:0 0 16px;font-size:18px;color:#1a73e8;border-bottom:2px solid #e8f0fe;padding-bottom:8px">
                Category Breakdown (Top 5)
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                <tr style="background:#e8f0fe">
                  <th style="padding:10px 12px;text-align:left;font-size:13px;color:#555;font-weight:600">Category</th>
                  <th style="padding:10px 12px;text-align:right;font-size:13px;color:#555;font-weight:600">Revenue</th>
                  <th style="padding:10px 12px;text-align:center;font-size:13px;color:#555;font-weight:600">% of Total</th>
                </tr>
                ${categoryRows}
              </table>
            </td>
          </tr>
          <!-- ===== CTA BUTTON ===== -->
          <tr>
            <td style="padding:24px 40px;text-align:center">
              <a href="${dashboardUrl}"
                 style="display:inline-block;background:#1a73e8;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:600">
                View Full Dashboard
              </a>
            </td>
          </tr>
          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #e0e0e0;text-align:center">
              <p style="margin:0 0 8px;font-size:12px;color:#888">
                You are receiving this email because you are subscribed to weekly sales reports.
              </p>
              <p style="margin:0;font-size:12px;color:#888">
                <a href="${unsubUrl}" style="color:#1a73e8;text-decoration:none">Unsubscribe</a>
                &nbsp;&bull;&nbsp;
                <a href="${frontendUrl}/settings/email-preferences" style="color:#1a73e8;text-decoration:none">Manage Preferences</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#aaa">
                Campus Mitra &copy; ${new Date().getFullYear()} &bull; All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
  /**
   * Get the delivery status for a given Bull job ID.
   *
   * @param {string} jobId
   * @returns {Promise<{status: string, attempts: number, lastError: string|null, nextRetry: Date|null}>}
   */
  async getEmailDeliveryStatus(jobId) {
    try {
      const EmailDeliveryLog = require('../../models/EmailDeliveryLog');
      const log = await EmailDeliveryLog.findOne({ jobId }).sort({ createdAt: -1 }).lean();
      if (!log) {
        return { status: 'not_found', attempts: 0, lastError: null, nextRetry: null };
      }
      const lastAttempt = log.attempts && log.attempts.length
        ? log.attempts[log.attempts.length - 1]
        : null;
      return {
        status: log.finalStatus,
        attempts: log.attempts ? log.attempts.length : 0,
        lastError: lastAttempt ? lastAttempt.error || null : null,
        nextRetry: lastAttempt ? lastAttempt.nextRetry || null : null,
      };
    } catch (err) {
      logger.error('EmailDeliveryService: getEmailDeliveryStatus failed', { jobId, error: err.message });
      return { status: 'error', attempts: 0, lastError: err.message, nextRetry: null };
    }
  }
  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------
  /**
   * Check if an admin has opted out of emails.
   * Returns true if the admin should be skipped.
   * @private
   */
  async _checkOptOut(adminId) {
    try {
      const EmailPreference = require('../../models/EmailPreference');
      const pref = await EmailPreference.findOne({ adminId }).lean();
      if (!pref) {
        // No preference record → default is subscribed
        return false;
      }
      if (pref.subscribed === false || pref.frequency === 'never') {
        return true;
      }
      return false;
    } catch (err) {
      logger.warn('EmailDeliveryService: could not check email preference, proceeding with send', {
        adminId,
        error: err.message,
      });
      return false; // fail-open: send if we can't check
    }
  }
  /**
   * Write a delivery log entry to EmailDeliveryLog collection.
   * @private
   */
  async _logDelivery({ jobId, adminId, email, status, messageId, errorMessage, dateRange = {} }) {
    try {
      const EmailDeliveryLog = require('../../models/EmailDeliveryLog');
      const attemptEntry = {
        attemptNumber: 1,
        timestamp: new Date(),
        status: status === 'sent' ? 'sent' : status === 'skipped' ? 'pending' : 'failed',
        error: errorMessage || '',
        nextRetry: null,
      };
      // Map status to finalStatus enum
      const finalStatusMap = {
        sent: 'delivered',
        failed: 'failed',
        skipped: 'pending',
      };
      const logData = {
        jobId: String(jobId),
        adminId: adminId || undefined,
        email: email || '',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: dateRange.startDate ? new Date(dateRange.startDate) : new Date(),
          endDate: dateRange.endDate ? new Date(dateRange.endDate) : new Date(),
        },
        attempts: [attemptEntry],
        finalStatus: finalStatusMap[status] || 'pending',
        messageId: messageId || '',
      };
      // Upsert: if a log for this jobId already exists, push a new attempt
      const existing = await EmailDeliveryLog.findOne({ jobId: String(jobId) });
      if (existing) {
        existing.attempts.push(attemptEntry);
        existing.finalStatus = logData.finalStatus;
        existing.messageId = messageId || existing.messageId;
        existing.updatedAt = new Date();
        await existing.save();
      } else {
        await EmailDeliveryLog.create(logData);
      }
      logger.info('EmailDeliveryService: delivery logged', { jobId, status });
    } catch (err) {
      // Logging failure must not break the email flow
      logger.error('EmailDeliveryService: failed to write delivery log', {
        jobId,
        error: err.message,
      });
    }
  }
  /** @private */
  async _updateLastEmailSent(adminId) {
    try {
      const EmailPreference = require('../../models/EmailPreference');
      await EmailPreference.updateOne({ adminId }, { $set: { lastEmailSent: new Date() } });
    } catch (err) {
      logger.warn('EmailDeliveryService: could not update lastEmailSent', { adminId, error: err.message });
    }
  }
  /** @private */
  _buildSubject(dateRange) {
    const fmtDate = (d) => {
      if (!d) return '';
      const dt = d instanceof Date ? d : new Date(d);
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    if (dateRange.startDate && dateRange.endDate) {
      return `Campus Mitra Weekly Sales Report: ${fmtDate(dateRange.startDate)} – ${fmtDate(dateRange.endDate)}`;
    }
    return 'Campus Mitra Weekly Sales Report';
  }
  /**
   * Escape HTML special characters to prevent XSS in email template.
   * @private
   */
  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  /** @private */
  _initTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } catch (err) {
      logger.error('EmailDeliveryService: failed to create transporter', { error: err.message });
    }
  }
  /**
   * Initialise Bull queue for email jobs with exponential backoff retry.
   * Gracefully skips if Bull or Redis is unavailable.
   * @private
   */
  _initQueue() {
    try {
      Queue = require('bull');
    } catch {
      logger.warn('EmailDeliveryService: bull package not installed; queue disabled');
      return;
    }
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
      this.emailQueue = new Queue('weekly-email-reports', redisUrl);
      // Process jobs: each job calls sendWeeklyEmail
      this.emailQueue.process(async (job) => {
        const { adminEmail, reportData, options } = job.data;
        return this.sendWeeklyEmail(adminEmail, reportData, {
          ...options,
          jobId: String(job.id),
        });
      });
      // Log failed jobs
      this.emailQueue.on('failed', (job, err) => {
        logger.error('EmailDeliveryService: queue job failed', {
          jobId: job.id,
          adminEmail: job.data.adminEmail,
          error: err.message,
          attemptsMade: job.attemptsMade,
        });
      });
      // Log completed jobs
      this.emailQueue.on('completed', (job) => {
        logger.info('EmailDeliveryService: queue job completed', {
          jobId: job.id,
          adminEmail: job.data.adminEmail,
        });
      });
      logger.info('EmailDeliveryService: Bull queue initialised');
    } catch (err) {
      logger.warn('EmailDeliveryService: could not connect to Redis; queue disabled', {
        error: err.message,
      });
      this.emailQueue = null;
    }
  }
}
module.exports = new EmailDeliveryService();
