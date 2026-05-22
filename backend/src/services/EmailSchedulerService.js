'use strict';

const cron = require('node-cron');
const logger = require('./logger.service');
const emailDeliveryService = require('./EmailDeliveryService');
const reportGeneratorService = require('./ReportGeneratorService');

/**
 * EmailSchedulerService
 *
 * Manages recurring email scheduling for weekly sales reports.
 * Runs every Monday at 9:00 AM IST (03:30 UTC).
 *
 * Workflow:
 *   1. Fetch all subscribed admins from EmailPreference
 *   2. Generate aggregated report data
 *   3. Render email template
 *   4. Queue email delivery via Bull with retry logic
 *   5. Log scheduling activity and errors
 *   6. Monitor job completion and failures
 *
 * Environment variables:
 *   SCHEDULER_ENABLED - Set to 'true' to enable scheduler (default: true)
 *   SCHEDULER_TIMEZONE - Timezone for cron (default: 'Asia/Kolkata')
 *   REPORT_AGGREGATION_DAYS - Days to include in report (default: 7)
 *
 * Validates: Requirements 9, 15, 17, 19 (Email delivery, preferences, retry, monitoring)
 */
class EmailSchedulerService {
  constructor() {
    /** Cron job instance */
    this.cronJob = null;

    /** Whether scheduler is enabled */
    this.enabled = process.env.SCHEDULER_ENABLED !== 'false';

    /** Timezone for cron scheduling */
    this.timezone = process.env.SCHEDULER_TIMEZONE || 'Asia/Kolkata';

    /** Number of days to include in report aggregation */
    this.reportDays = parseInt(process.env.REPORT_AGGREGATION_DAYS || '7', 10);

    /** Track if scheduler is running */
    this.isRunning = false;

    /** Last execution timestamp */
    this.lastExecution = null;

    /** Last execution status */
    this.lastExecutionStatus = null;

    /** Execution count */
    this.executionCount = 0;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Start the email scheduler.
   * Schedules a cron job to run every Monday at 9:00 AM IST.
   *
   * Cron expression: 0 9 * * 1
   *   - 0: minute (0)
   *   - 9: hour (9 AM)
   *   - *: day of month (any)
   *   - *: month (any)
   *   - 1: day of week (Monday)
   *
   * @returns {void}
   */
  start() {
    if (!this.enabled) {
      logger.info('EmailSchedulerService: scheduler disabled via SCHEDULER_ENABLED');
      return;
    }

    if (this.isRunning) {
      logger.warn('EmailSchedulerService: scheduler already running');
      return;
    }

    try {
      // Schedule for Monday 9:00 AM IST
      this.cronJob = cron.schedule(
        '0 9 * * 1',
        () => this._executeScheduledJob(),
        {
          timezone: this.timezone,
          runOnInit: false,
        }
      );

      this.isRunning = true;
      logger.info('EmailSchedulerService: scheduler started', {
        timezone: this.timezone,
        schedule: 'Monday 9:00 AM IST',
      });
    } catch (err) {
      logger.error('EmailSchedulerService: failed to start scheduler', { error: err.message });
      this.isRunning = false;
    }
  }

  /**
   * Stop the email scheduler.
   *
   * @returns {void}
   */
  stop() {
    if (!this.cronJob) {
      logger.warn('EmailSchedulerService: no active scheduler to stop');
      return;
    }

    try {
      this.cronJob.stop();
      this.isRunning = false;
      logger.info('EmailSchedulerService: scheduler stopped');
    } catch (err) {
      logger.error('EmailSchedulerService: failed to stop scheduler', { error: err.message });
    }
  }

  /**
   * Get scheduler status and metrics.
   *
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      enabled: this.enabled,
      isRunning: this.isRunning,
      timezone: this.timezone,
      reportDays: this.reportDays,
      executionCount: this.executionCount,
      lastExecution: this.lastExecution,
      lastExecutionStatus: this.lastExecutionStatus,
    };
  }

  /**
   * Manually trigger the scheduled job (for testing/admin purposes).
   *
   * @returns {Promise<Object>} Execution result
   */
  async triggerManually() {
    logger.info('EmailSchedulerService: manual trigger initiated');
    return this._executeScheduledJob();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Execute the scheduled job: fetch admins, generate report, queue emails.
   * @private
   */
  async _executeScheduledJob() {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const startTime = Date.now();

    logger.info('EmailSchedulerService: job execution started', { executionId });

    try {
      // Step 1: Fetch subscribed admins
      const admins = await this._fetchSubscribedAdmins();
      logger.info('EmailSchedulerService: fetched subscribed admins', {
        executionId,
        count: admins.length,
      });

      if (admins.length === 0) {
        logger.info('EmailSchedulerService: no subscribed admins found', { executionId });
        this._recordExecution('success', 0, startTime);
        return { executionId, status: 'success', adminCount: 0 };
      }

      // Step 2: Generate aggregated report data
      const dateRange = this._calculateDateRange();
      let reportData;
      try {
        reportData = await this._generateReportData(dateRange);
        logger.info('EmailSchedulerService: report data generated', {
          executionId,
          dateRange,
        });
      } catch (reportErr) {
        logger.error('EmailSchedulerService: report generation failed', {
          executionId,
          error: reportErr.message,
        });
        this._recordExecution('failed', 0, startTime, reportErr.message);
        throw reportErr;
      }

      // Step 3: Queue emails for each admin
      const queuedJobs = [];
      const failedQueues = [];

      for (const admin of admins) {
        try {
          // Validate subscription before queuing
          const shouldSkip = await this._checkOptOut(admin._id);
          if (shouldSkip) {
            logger.info('EmailSchedulerService: skipping unsubscribed admin', {
              executionId,
              adminId: admin._id,
            });
            continue;
          }

          // Queue the email
          const job = await emailDeliveryService.scheduleWeeklyReport(
            admin.email,
            reportData,
            {
              adminId: admin._id,
              dateRange,
            }
          );

          queuedJobs.push({
            adminId: admin._id,
            email: admin.email,
            jobId: job.id || job.messageId || 'direct_send',
          });

          logger.info('EmailSchedulerService: email queued', {
            executionId,
            adminId: admin._id,
            jobId: job.id,
          });
        } catch (queueErr) {
          logger.error('EmailSchedulerService: failed to queue email', {
            executionId,
            adminId: admin._id,
            error: queueErr.message,
          });
          failedQueues.push({
            adminId: admin._id,
            email: admin.email,
            error: queueErr.message,
          });
        }
      }

      // Step 4: Log execution summary
      const executionTime = Date.now() - startTime;
      const result = {
        executionId,
        status: failedQueues.length === 0 ? 'success' : 'partial',
        totalAdmins: admins.length,
        queuedCount: queuedJobs.length,
        failedCount: failedQueues.length,
        executionTime,
        dateRange,
      };

      this._recordExecution(result.status, queuedJobs.length, startTime);

      logger.info('EmailSchedulerService: job execution completed', result);

      // Step 5: Alert on failures
      if (failedQueues.length > 0) {
        await this._alertOnFailures(executionId, failedQueues);
      }

      return result;
    } catch (err) {
      const executionTime = Date.now() - startTime;
      logger.error('EmailSchedulerService: job execution failed', {
        executionId,
        error: err.message,
        executionTime,
      });

      this._recordExecution('failed', 0, startTime, err.message);

      // Alert on critical failure
      await this._alertOnCriticalFailure(executionId, err);

      throw err;
    }
  }

  /**
   * Fetch all subscribed admins from EmailPreference collection.
   * @private
   */
  async _fetchSubscribedAdmins() {
    try {
      const EmailPreference = require('../../models/EmailPreference');
      const admins = await EmailPreference.find({
        subscribed: true,
        frequency: { $in: ['weekly', 'monthly'] },
      })
        .select('adminId email')
        .lean();

      return admins;
    } catch (err) {
      logger.error('EmailSchedulerService: failed to fetch subscribed admins', {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Check if an admin has opted out.
   * @private
   */
  async _checkOptOut(adminId) {
    try {
      const EmailPreference = require('../../models/EmailPreference');
      const pref = await EmailPreference.findOne({ adminId }).lean();
      if (!pref) return false;
      return pref.subscribed === false || pref.frequency === 'never';
    } catch (err) {
      logger.warn('EmailSchedulerService: could not check opt-out status', {
        adminId,
        error: err.message,
      });
      return false; // fail-open
    }
  }

  /**
   * Calculate date range for report (last 7 days by default).
   * @private
   */
  _calculateDateRange() {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - this.reportDays);
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }

  /**
   * Generate aggregated report data using ReportGeneratorService.
   * @private
   */
  async _generateReportData(dateRange) {
    try {
      // Fetch all required metrics
      const [
        paymentMetrics,
        salesMetrics,
        topProducts,
        topSellers,
        categoryBreakdown,
      ] = await Promise.all([
        reportGeneratorService.getPaymentMetrics(dateRange),
        reportGeneratorService.getSalesMetrics(dateRange),
        reportGeneratorService.getTopProducts(dateRange),
        reportGeneratorService.getTopSellers(dateRange),
        reportGeneratorService.getCategoryBreakdown(dateRange),
      ]);

      // Combine into single report object
      const reportData = {
        metrics: {
          totalRevenue: salesMetrics.totalRevenue || 0,
          salesVolume: salesMetrics.totalOrders || 0,
          totalOrders: salesMetrics.totalOrders || 0,
          avgOrderValue: salesMetrics.avgOrderValue || 0,
          weekOverWeekChange: salesMetrics.weekOverWeekChange || 0,
          paymentSuccessRate: paymentMetrics.successRate || 0,
          successRate: paymentMetrics.successRate || 0,
        },
        topProducts: topProducts || [],
        topSellers: topSellers || [],
        categoryBreakdown: categoryBreakdown || [],
        categories: categoryBreakdown || [],
      };

      return reportData;
    } catch (err) {
      logger.error('EmailSchedulerService: report data generation failed', {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Record execution metrics for monitoring.
   * @private
   */
  _recordExecution(status, emailsQueued, startTime, errorMessage = null) {
    this.executionCount += 1;
    this.lastExecution = new Date();
    this.lastExecutionStatus = {
      status,
      emailsQueued,
      executionTime: Date.now() - startTime,
      errorMessage,
    };

    logger.info('EmailSchedulerService: execution recorded', {
      executionCount: this.executionCount,
      status,
      emailsQueued,
      executionTime: this.lastExecutionStatus.executionTime,
    });
  }

  /**
   * Alert on partial/failed email queuing.
   * @private
   */
  async _alertOnFailures(executionId, failedQueues) {
    try {
      logger.error('EmailSchedulerService: email queuing failures detected', {
        executionId,
        failedCount: failedQueues.length,
        failures: failedQueues,
      });

      // TODO: Implement alerting mechanism (e.g., Slack, PagerDuty, email to ops)
      // For now, just log the failures
    } catch (err) {
      logger.error('EmailSchedulerService: failed to send alert', { error: err.message });
    }
  }

  /**
   * Alert on critical scheduler failure.
   * @private
   */
  async _alertOnCriticalFailure(executionId, error) {
    try {
      logger.error('EmailSchedulerService: critical failure alert', {
        executionId,
        error: error.message,
      });

      // TODO: Implement critical alerting mechanism
      // For now, just log the error
    } catch (err) {
      logger.error('EmailSchedulerService: failed to send critical alert', {
        error: err.message,
      });
    }
  }
}

module.exports = new EmailSchedulerService();
