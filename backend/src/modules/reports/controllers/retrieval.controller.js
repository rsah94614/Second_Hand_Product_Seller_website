'use strict';

const logger = require('../../../services/logger.service');
const reportGeneratorService = require('../../../services/ReportGeneratorService');
const monitoringService = require('../../../services/MonitoringService');

/**
 * Get sales metrics for a date range
 * GET /admin/reports/sales-metrics
 * Query: startDate, endDate
 */
exports.getSalesMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getSalesMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting sales metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get sales metrics',
      error: error.message,
    });
  }
};

/**
 * Get payment metrics for a date range
 * GET /admin/reports/payment-metrics
 * Query: startDate, endDate
 */
exports.getPaymentMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getPaymentMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting payment metrics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get payment metrics',
      error: error.message,
    });
  }
};

/**
 * Get top sellers for a date range
 * GET /admin/reports/top-sellers
 * Query: startDate, endDate, limit
 */
exports.getTopSellers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const sellers = await reportGeneratorService.getTopSellers(dateRange, parseInt(limit, 10));

    res.json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    logger.error('Error getting top sellers', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get top sellers',
      error: error.message,
    });
  }
};

/**
 * Get sales trends for a date range
 * GET /admin/reports/sales-trends
 * Query: startDate, endDate, granularity (daily, weekly, monthly)
 */
exports.getSalesTrends = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'daily' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const trends = await reportGeneratorService.getSalesTrends(dateRange, granularity);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error getting sales trends', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get sales trends',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get dashboard report
 * GET /admin/reports/dashboard
 * Query: startDate, endDate
 */
exports.getDashboardReport = async (req, res) => {
  const startTime = Date.now();
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getDashboardMetrics(dateRange);

    const generationTimeMs = Date.now() - startTime;

    // Track report generation metrics
    monitoringService.trackReportGeneration({
      reportType: 'dashboard',
      generationTimeMs,
      status: 'success',
      adminId: req.user._id,
    });

    res.json({
      success: true,
      data: metrics,
      generationTimeMs,
    });
  } catch (error) {
    logger.error('Error getting dashboard report', { error: error.message });

    // Track failed report generation
    monitoringService.trackReportGeneration({
      reportType: 'dashboard',
      generationTimeMs: Date.now() - startTime,
      status: 'failure',
      adminId: req.user._id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get top products report
 * GET /admin/reports/top-products
 * Query: startDate, endDate, limit, sortBy
 */
exports.getTopProductsReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10, sortBy = 'quantity' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const products = await reportGeneratorService.getTopProducts(dateRange, parseInt(limit, 10), sortBy);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    logger.error('Error getting top products report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get top products report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get categories report
 * GET /admin/reports/categories
 * Query: startDate, endDate
 */
exports.getCategoriesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const categories = await reportGeneratorService.getCategoryBreakdown(dateRange);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error getting categories report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get categories report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get trends report
 * GET /admin/reports/trends
 * Query: startDate, endDate, granularity
 */
exports.getTrendsReport = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'daily' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const trends = await reportGeneratorService.getSalesTrends(dateRange, granularity);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    logger.error('Error getting trends report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get trends report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get sellers report
 * GET /admin/reports/sellers
 * Query: startDate, endDate, limit, sortBy
 */
exports.getSellersReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 50, sortBy = 'revenue' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const sellers = await reportGeneratorService.getSellerRankings(dateRange, sortBy, parseInt(limit, 10));

    res.json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    logger.error('Error getting sellers report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get sellers report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get payments report
 * GET /admin/reports/payments
 * Query: startDate, endDate
 */
exports.getPaymentsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getPaymentMetrics(dateRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting payments report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get payments report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get transactions report
 * GET /admin/reports/transactions
 * Query: startDate, endDate, category
 */
exports.getTransactionsReport = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate query parameters are required',
      });
    }

    const dateRange = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const metrics = await reportGeneratorService.getTransactionMetrics(dateRange, category || null);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error getting transactions report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions report',
      error: error.message,
    });
  }
};

/**
 * Phase 4.1 - Get compare report
 * GET /admin/reports/compare
 * Query: period1Start, period1End, period2Start, period2End
 */
exports.getCompareReport = async (req, res) => {
  try {
    const { period1Start, period1End, period2Start, period2End } = req.query;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({
        success: false,
        message: 'period1Start, period1End, period2Start, and period2End query parameters are required',
      });
    }

    const comparison = await reportGeneratorService.comparePeriods(
      new Date(period1Start),
      new Date(period1End),
      new Date(period2Start),
      new Date(period2End)
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    logger.error('Error getting compare report', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get compare report',
      error: error.message,
    });
  }
};
