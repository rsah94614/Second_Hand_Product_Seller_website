'use strict';

const logger = require('./logger.service');

/**
 * MonitoringService
 * 
 * Tracks and monitors report generation performance, email delivery, and cache metrics.
 * Implements anomaly detection and alert triggering for SLA violations.
 * 
 * **Validates: Requirements 19, 20 (Monitoring, alerting)**
 */
class MonitoringService {
  constructor() {
    // In-memory metrics storage
    this.metrics = {
      reportGeneration: [],
      emailDelivery: [],
      cacheStats: {
        hits: 0,
        misses: 0,
        totalRequests: 0,
      },
      anomalies: [],
    };

    // Configuration
    this.config = {
      slaThresholdMs: 5000, // 5 seconds SLA for report generation
      anomalyThreshold: 2.0, // 200% spike detection
      metricsRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
      alertCallbacks: [],
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Register alert callback
   * 
   * @param {Function} callback - Function to call when alert is triggered
   */
  registerAlertCallback(callback) {
    if (typeof callback === 'function') {
      this.config.alertCallbacks.push(callback);
    }
  }

  /**
   * Track report generation time
   * 
   * @param {Object} params - Tracking parameters
   * @param {string} params.reportType - Type of report generated
   * @param {number} params.generationTimeMs - Time taken to generate report
   * @param {string} params.status - Generation status (success, failure)
   * @param {string} params.adminId - Admin who requested the report
   * @returns {Object} Metric entry
   */
  trackReportGeneration(params) {
    try {
      const {
        reportType,
        generationTimeMs,
        status = 'success',
        adminId,
      } = params;

      const timestamp = new Date();
      const metric = {
        reportType,
        generationTimeMs,
        status,
        adminId,
        timestamp,
      };

      // Add to metrics
      this.metrics.reportGeneration.push(metric);

      // Check for SLA violation
      if (generationTimeMs > this.config.slaThresholdMs) {
        this.triggerAlert({
          type: 'SLA_VIOLATION',
          severity: 'warning',
          message: `Report generation exceeded SLA: ${reportType} took ${generationTimeMs}ms (threshold: ${this.config.slaThresholdMs}ms)`,
          metric,
        });
      }

      // Check for anomalies
      this.detectAnomalies('reportGeneration', reportType);

      logger.info('Report generation tracked', {
        reportType,
        generationTimeMs,
        status,
      });

      return metric;
    } catch (error) {
      logger.error('Error tracking report generation', { error: error.message });
      return null;
    }
  }

  /**
   * Track email delivery attempt
   * 
   * @param {Object} params - Tracking parameters
   * @param {string} params.adminId - Admin receiving email
   * @param {string} params.status - Delivery status (sent, failed, bounced)
   * @param {string} params.errorMessage - Error message if failed
   * @param {number} params.attemptNumber - Attempt number for retries
   * @returns {Object} Metric entry
   */
  trackEmailDelivery(params) {
    try {
      const {
        adminId,
        status,
        errorMessage = '',
        attemptNumber = 1,
      } = params;

      const timestamp = new Date();
      const metric = {
        adminId,
        status,
        errorMessage,
        attemptNumber,
        timestamp,
      };

      // Add to metrics
      this.metrics.emailDelivery.push(metric);

      // Alert on failure
      if (status === 'failed' || status === 'bounced') {
        this.triggerAlert({
          type: 'EMAIL_DELIVERY_FAILURE',
          severity: 'error',
          message: `Email delivery failed for admin ${adminId}: ${errorMessage}`,
          metric,
        });
      }

      logger.info('Email delivery tracked', {
        adminId,
        status,
        attemptNumber,
      });

      return metric;
    } catch (error) {
      logger.error('Error tracking email delivery', { error: error.message });
      return null;
    }
  }

  /**
   * Track cache hit/miss
   * 
   * @param {Object} params - Tracking parameters
   * @param {string} params.cacheKey - Cache key accessed
   * @param {boolean} params.hit - Whether it was a cache hit
   * @param {string} params.reportType - Type of report
   */
  trackCacheAccess(params) {
    try {
      const { cacheKey, hit, reportType } = params;

      if (hit) {
        this.metrics.cacheStats.hits++;
      } else {
        this.metrics.cacheStats.misses++;
      }
      this.metrics.cacheStats.totalRequests++;

      logger.debug('Cache access tracked', {
        cacheKey,
        hit,
        reportType,
        hitRate: this.getCacheHitRate(),
      });
    } catch (error) {
      logger.error('Error tracking cache access', { error: error.message });
    }
  }

  /**
   * Detect anomalies in metrics
   * 
   * @param {string} metricType - Type of metric to analyze
   * @param {string} reportType - Report type for filtering
   */
  detectAnomalies(metricType, reportType) {
    try {
      if (metricType === 'reportGeneration') {
        const recentMetrics = this.metrics.reportGeneration
          .filter(m => m.reportType === reportType)
          .slice(-10); // Last 10 metrics

        if (recentMetrics.length < 2) return;

        // Calculate average
        const avgTime = recentMetrics.reduce((sum, m) => sum + m.generationTimeMs, 0) / recentMetrics.length;

        // Check latest metric for spike
        const latest = recentMetrics[recentMetrics.length - 1];
        const spike = latest.generationTimeMs / avgTime;

        if (spike > this.config.anomalyThreshold) {
          const anomaly = {
            type: 'METRIC_SPIKE',
            metricType,
            reportType,
            spike: spike.toFixed(2),
            currentValue: latest.generationTimeMs,
            averageValue: avgTime.toFixed(2),
            timestamp: new Date(),
          };

          this.metrics.anomalies.push(anomaly);

          this.triggerAlert({
            type: 'ANOMALY_DETECTED',
            severity: 'warning',
            message: `Anomaly detected: ${reportType} generation time spiked ${spike.toFixed(2)}x (${latest.generationTimeMs}ms vs avg ${avgTime.toFixed(2)}ms)`,
            anomaly,
          });

          logger.warn('Anomaly detected', anomaly);
        }
      }
    } catch (error) {
      logger.error('Error detecting anomalies', { error: error.message });
    }
  }

  /**
   * Trigger alert notification
   * 
   * @param {Object} alert - Alert object
   */
  triggerAlert(alert) {
    try {
      const alertWithTimestamp = {
        ...alert,
        timestamp: new Date(),
      };

      logger.warn('Alert triggered', alertWithTimestamp);

      // Call registered callbacks
      this.config.alertCallbacks.forEach(callback => {
        try {
          callback(alertWithTimestamp);
        } catch (error) {
          logger.error('Error in alert callback', { error: error.message });
        }
      });
    } catch (error) {
      logger.error('Error triggering alert', { error: error.message });
    }
  }

  /**
   * Get cache hit rate
   * 
   * @returns {number} Hit rate percentage
   */
  getCacheHitRate() {
    if (this.metrics.cacheStats.totalRequests === 0) return 0;
    return (this.metrics.cacheStats.hits / this.metrics.cacheStats.totalRequests * 100).toFixed(2);
  }

  /**
   * Get cache statistics
   * 
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      hits: this.metrics.cacheStats.hits,
      misses: this.metrics.cacheStats.misses,
      totalRequests: this.metrics.cacheStats.totalRequests,
      hitRate: `${this.getCacheHitRate()}%`,
      missRate: `${(100 - parseFloat(this.getCacheHitRate())).toFixed(2)}%`,
    };
  }

  /**
   * Get report generation metrics
   * 
   * @param {Object} params - Query parameters
   * @param {string} params.reportType - Filter by report type
   * @param {number} params.limit - Number of recent metrics to return
   * @returns {Object} Report generation metrics
   */
  getReportGenerationMetrics(params = {}) {
    try {
      const { reportType, limit = 100 } = params;

      let metrics = this.metrics.reportGeneration;

      if (reportType) {
        metrics = metrics.filter(m => m.reportType === reportType);
      }

      // Get recent metrics
      const recent = metrics.slice(-limit);

      // Calculate statistics
      const successCount = recent.filter(m => m.status === 'success').length;
      const failureCount = recent.filter(m => m.status === 'failure').length;
      const avgTime = recent.length > 0
        ? (recent.reduce((sum, m) => sum + m.generationTimeMs, 0) / recent.length).toFixed(2)
        : 0;
      const maxTime = recent.length > 0
        ? Math.max(...recent.map(m => m.generationTimeMs))
        : 0;
      const minTime = recent.length > 0
        ? Math.min(...recent.map(m => m.generationTimeMs))
        : 0;

      return {
        totalMetrics: recent.length,
        successCount,
        failureCount,
        successRate: recent.length > 0 ? `${(successCount / recent.length * 100).toFixed(2)}%` : '0%',
        averageTimeMs: avgTime,
        maxTimeMs: maxTime,
        minTimeMs: minTime,
        slaViolations: recent.filter(m => m.generationTimeMs > this.config.slaThresholdMs).length,
        recentMetrics: recent.slice(-10),
      };
    } catch (error) {
      logger.error('Error getting report generation metrics', { error: error.message });
      return null;
    }
  }

  /**
   * Get email delivery metrics
   * 
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of recent metrics to return
   * @returns {Object} Email delivery metrics
   */
  getEmailDeliveryMetrics(params = {}) {
    try {
      const { limit = 100 } = params;

      const recent = this.metrics.emailDelivery.slice(-limit);

      // Calculate statistics
      const sentCount = recent.filter(m => m.status === 'sent').length;
      const failedCount = recent.filter(m => m.status === 'failed').length;
      const bouncedCount = recent.filter(m => m.status === 'bounced').length;
      const successRate = recent.length > 0
        ? (sentCount / recent.length * 100).toFixed(2)
        : 0;

      return {
        totalMetrics: recent.length,
        sentCount,
        failedCount,
        bouncedCount,
        successRate: `${successRate}%`,
        failureRate: `${(100 - parseFloat(successRate)).toFixed(2)}%`,
        recentMetrics: recent.slice(-10),
      };
    } catch (error) {
      logger.error('Error getting email delivery metrics', { error: error.message });
      return null;
    }
  }

  /**
   * Get anomalies detected
   * 
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of recent anomalies to return
   * @returns {Array} Anomalies
   */
  getAnomalies(params = {}) {
    try {
      const { limit = 50 } = params;
      return this.metrics.anomalies.slice(-limit);
    } catch (error) {
      logger.error('Error getting anomalies', { error: error.message });
      return [];
    }
  }

  /**
   * Export metrics to monitoring system (Prometheus/DataDog format)
   * 
   * @returns {Object} Metrics in Prometheus format
   */
  exportMetrics() {
    try {
      const reportMetrics = this.getReportGenerationMetrics();
      const emailMetrics = this.getEmailDeliveryMetrics();
      const cacheMetrics = this.getCacheStats();

      return {
        timestamp: new Date().toISOString(),
        metrics: {
          report_generation: reportMetrics,
          email_delivery: emailMetrics,
          cache: cacheMetrics,
        },
        anomalies: {
          count: this.metrics.anomalies.length,
          recent: this.getAnomalies({ limit: 10 }),
        },
      };
    } catch (error) {
      logger.error('Error exporting metrics', { error: error.message });
      return null;
    }
  }

  /**
   * Start cleanup interval to remove old metrics
   */
  startCleanupInterval() {
    setInterval(() => {
      try {
        const now = Date.now();
        const threshold = this.config.metricsRetentionMs;

        // Clean old report generation metrics
        this.metrics.reportGeneration = this.metrics.reportGeneration.filter(
          m => (now - m.timestamp.getTime()) < threshold
        );

        // Clean old email delivery metrics
        this.metrics.emailDelivery = this.metrics.emailDelivery.filter(
          m => (now - m.timestamp.getTime()) < threshold
        );

        // Clean old anomalies
        this.metrics.anomalies = this.metrics.anomalies.filter(
          m => (now - m.timestamp.getTime()) < threshold
        );

        logger.debug('Metrics cleanup completed', {
          reportGenerationCount: this.metrics.reportGeneration.length,
          emailDeliveryCount: this.metrics.emailDelivery.length,
          anomaliesCount: this.metrics.anomalies.length,
        });
      } catch (error) {
        logger.error('Error in metrics cleanup', { error: error.message });
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Reset all metrics (for testing)
   */
  resetMetrics() {
    this.metrics = {
      reportGeneration: [],
      emailDelivery: [],
      cacheStats: {
        hits: 0,
        misses: 0,
        totalRequests: 0,
      },
      anomalies: [],
    };
  }
}

module.exports = new MonitoringService();
