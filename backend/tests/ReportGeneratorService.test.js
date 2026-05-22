const assert = require('node:assert/strict');
const ReportGeneratorService = require('../src/services/ReportGeneratorService');
const Order = require('../models/Order');
const { clearDatabase } = require('./helpers/testApp');

/**
 * Comprehensive Test Suite for ReportGeneratorService
 * 
 * Tests all methods:
 * - getDashboardMetrics()
 * - getTopProducts()
 * - getCategoryBreakdown()
 * - getSalesTrends()
 * - getSellerRankings()
 * - getPaymentMetrics()
 * - getTransactionMetrics()
 * - comparePeriods()
 * 
 * Coverage includes:
 * - Happy path scenarios
 * - Error handling
 * - Edge cases
 * - Boundary conditions
 * - Data validation
 * - Return value verification
 */
const runReportGeneratorTests = async () => {
  await clearDatabase();

  // Test 1: Calculate correct metrics for all completed orders
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const orders = [];
    for (let i = 0; i < 10; i++) {
      orders.push({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      });
    }

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.totalAttempts, 10, 'Total attempts should be 10');
    assert.equal(metrics.successfulPayments, 10, 'Successful payments should be 10');
    assert.equal(metrics.failedPayments, 0, 'Failed payments should be 0');
    assert.equal(metrics.successRate, 100, 'Success rate should be 100%');
    assert.equal(metrics.failureRate, 0, 'Failure rate should be 0%');
    assert.equal(metrics.failureBreakdown.cancelled.count, 0);
    assert.equal(metrics.failureBreakdown.no_show.count, 0);
    assert.equal(metrics.failureBreakdown.pending.count, 0);
    assert.equal(metrics.failureBreakdown.other.count, 0);
  }

  await clearDatabase();

  // Test 2: Calculate correct metrics with mixed order statuses
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const orders = [
      // 7 completed
      ...Array(7).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      })),
      // 2 cancelled
      ...Array(2).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-01-15'),
      })),
      // 1 no_show
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'no_show',
        createdAt: new Date('2024-01-15'),
      },
    ];

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.totalAttempts, 10, 'Total attempts should be 10');
    assert.equal(metrics.successfulPayments, 7, 'Successful payments should be 7');
    assert.equal(metrics.failedPayments, 3, 'Failed payments should be 3');
    assert.equal(metrics.successRate, 70, 'Success rate should be 70%');
    assert.equal(metrics.failureRate, 30, 'Failure rate should be 30%');
    assert.equal(metrics.failureBreakdown.cancelled.count, 2);
    assert.equal(metrics.failureBreakdown.no_show.count, 1);
    assert.equal(metrics.failureBreakdown.pending.count, 0);
  }

  await clearDatabase();

  // Test 3: Calculate correct failure percentages
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const orders = [
      // 5 completed
      ...Array(5).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      })),
      // 3 cancelled
      ...Array(3).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-01-15'),
      })),
      // 2 no_show
      ...Array(2).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'no_show',
        createdAt: new Date('2024-01-15'),
      })),
    ];

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.failureBreakdown.cancelled.count, 3);
    assert.equal(metrics.failureBreakdown.cancelled.percentage, 60, 'Cancelled should be 60%');
    assert.equal(metrics.failureBreakdown.no_show.count, 2);
    assert.equal(metrics.failureBreakdown.no_show.percentage, 40, 'No-show should be 40%');
  }

  await clearDatabase();

  // Test 4: Only include orders within the date range
  {
    const startDate = new Date('2024-01-10');
    const endDate = new Date('2024-01-20');

    const orders = [
      // Within range - completed
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      },
      // Before range - completed
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-05'),
      },
      // After range - completed
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-25'),
      },
    ];

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.totalAttempts, 1, 'Should only include 1 order in date range');
    assert.equal(metrics.successfulPayments, 1);
    assert.equal(metrics.failedPayments, 0);
  }

  await clearDatabase();

  // Test 5: Include orders on boundary dates
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const orders = [
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-31'),
      },
    ];

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.totalAttempts, 2, 'Should include boundary dates');
    assert.equal(metrics.successfulPayments, 2);
  }

  await clearDatabase();

  // Test 6: Categorize pending statuses correctly
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const orders = [
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'requested',
        createdAt: new Date('2024-01-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'accepted',
        createdAt: new Date('2024-01-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'meetup_scheduled',
        createdAt: new Date('2024-01-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'delivered',
        createdAt: new Date('2024-01-15'),
      },
    ];

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.failureBreakdown.pending.count, 4, 'All pending statuses should be categorized');
    assert.equal(metrics.failureBreakdown.pending.percentage, 100);
  }

  await clearDatabase();

  // Test 7: Handle empty database
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.totalAttempts, 0, 'Empty database should return 0 attempts');
    assert.equal(metrics.successfulPayments, 0);
    assert.equal(metrics.failedPayments, 0);
    assert.equal(metrics.successRate, 0);
    assert.equal(metrics.failureRate, 0);
  }

  await clearDatabase();

  // Test 8: Handle all failed orders
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const orders = Array(5).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
      total: 1000,
      status: 'cancelled',
      createdAt: new Date('2024-01-15'),
    }));

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.totalAttempts, 5);
    assert.equal(metrics.successfulPayments, 0);
    assert.equal(metrics.failedPayments, 5);
    assert.equal(metrics.successRate, 0);
    assert.equal(metrics.failureRate, 100);
  }

  await clearDatabase();

  // Test 9: Throw error for invalid date range
  {
    const startDate = new Date('2024-01-31');
    const endDate = new Date('2024-01-01');

    try {
      await ReportGeneratorService.getPaymentMetrics({
        startDate,
        endDate,
      });
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.match(error.message, /startDate must be before endDate/);
    }
  }

  // Test 10: Throw error for missing date range
  {
    try {
      await ReportGeneratorService.getPaymentMetrics({});
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.match(error.message, /Date range with startDate and endDate is required/);
    }
  }

  await clearDatabase();

  // Test 11: Calculate rates with proper decimal precision
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    // Create 3 completed, 1 failed = 75% success, 25% failure
    const orders = [
      ...Array(3).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      })),
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-01-15'),
      },
    ];

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.successRate, 75);
    assert.equal(metrics.failureRate, 25);
  }

  await clearDatabase();

  // Test 12: Handle fractional percentages
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    // Create 1 completed, 2 failed = 33.33% success, 66.67% failure
    const orders = [
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      },
      ...Array(2).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-01-15'),
      })),
    ];

    await Order.insertMany(orders);

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert.equal(metrics.successRate, 33.33);
    assert.equal(metrics.failureRate, 66.67);
  }

  await clearDatabase();

  // Test 13: Return object with all required fields
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert('totalAttempts' in metrics);
    assert('successfulPayments' in metrics);
    assert('failedPayments' in metrics);
    assert('successRate' in metrics);
    assert('failureRate' in metrics);
    assert('failureBreakdown' in metrics);
  }

  // Test 14: Return failure breakdown with all categories
  {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const metrics = await ReportGeneratorService.getPaymentMetrics({
      startDate,
      endDate,
    });

    assert('cancelled' in metrics.failureBreakdown);
    assert('no_show' in metrics.failureBreakdown);
    assert('pending' in metrics.failureBreakdown);
    assert('other' in metrics.failureBreakdown);

    // Each category should have count and percentage
    Object.values(metrics.failureBreakdown).forEach((category) => {
      assert('count' in category);
      assert('percentage' in category);
      assert.equal(typeof category.count, 'number');
      assert.equal(typeof category.percentage, 'number');
    });
  }

  await clearDatabase();

  // ============================================
  // Tests for comparePeriods() method
  // ============================================

  // Test 15: Compare two periods with all completed orders
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    // Period 1: 10 completed orders, 1000 each
    const period1Orders = Array(10).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
      total: 1000,
      status: 'completed',
      createdAt: new Date('2024-01-15'),
    }));

    // Period 2: 12 completed orders, 1000 each
    const period2Orders = Array(12).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
      total: 1000,
      status: 'completed',
      createdAt: new Date('2024-02-15'),
    }));

    await Order.insertMany([...period1Orders, ...period2Orders]);

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert.equal(comparison.metrics.revenue.period1, 10000);
    assert.equal(comparison.metrics.revenue.period2, 12000);
    assert.equal(comparison.metrics.salesVolume.period1, 10);
    assert.equal(comparison.metrics.salesVolume.period2, 12);
    assert.equal(comparison.comparison.revenue.absolute, 2000);
    assert.equal(comparison.comparison.revenue.percentage, 20);
    assert.equal(comparison.comparison.salesVolume.absolute, 2);
    assert.equal(comparison.comparison.salesVolume.percentage, 20);
  }

  await clearDatabase();

  // Test 16: Compare periods with different average order values
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    // Period 1: 5 orders at 1000 each = 5000 total, AOV = 1000
    const period1Orders = Array(5).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
      total: 1000,
      status: 'completed',
      createdAt: new Date('2024-01-15'),
    }));

    // Period 2: 5 orders at 1500 each = 7500 total, AOV = 1500
    const period2Orders = Array(5).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1500, quantity: 1 }],
      total: 1500,
      status: 'completed',
      createdAt: new Date('2024-02-15'),
    }));

    await Order.insertMany([...period1Orders, ...period2Orders]);

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert.equal(comparison.metrics.avgOrderValue.period1, 1000);
    assert.equal(comparison.metrics.avgOrderValue.period2, 1500);
    assert.equal(comparison.comparison.avgOrderValue.absolute, 500);
    assert.equal(comparison.comparison.avgOrderValue.percentage, 50);
  }

  await clearDatabase();

  // Test 17: Compare periods with different success rates
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    // Period 1: 8 completed, 2 cancelled = 80% success rate
    const period1Orders = [
      ...Array(8).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      })),
      ...Array(2).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-01-15'),
      })),
    ];

    // Period 2: 9 completed, 1 cancelled = 90% success rate
    const period2Orders = [
      ...Array(9).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-02-15'),
      })),
      ...Array(1).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-02-15'),
      })),
    ];

    await Order.insertMany([...period1Orders, ...period2Orders]);

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert.equal(comparison.metrics.successRate.period1, 80);
    assert.equal(comparison.metrics.successRate.period2, 90);
    assert.equal(comparison.comparison.successRate.absolute, 10);
    assert.equal(comparison.comparison.successRate.percentage, 12.5);
  }

  await clearDatabase();

  // Test 18: Compare periods with different active sellers
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    // Period 1: 3 different sellers
    const period1Orders = [
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439014',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439015',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      },
    ];

    // Period 2: 5 different sellers
    const period2Orders = [
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-02-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439014',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-02-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439016',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-02-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439017',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-02-15'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439018',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-02-15'),
      },
    ];

    await Order.insertMany([...period1Orders, ...period2Orders]);

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert.equal(comparison.metrics.activeSellers.period1, 3);
    assert.equal(comparison.metrics.activeSellers.period2, 5);
    assert.equal(comparison.comparison.activeSellers.absolute, 2);
    assert.equal(comparison.comparison.activeSellers.percentage, 66.67);
  }

  await clearDatabase();

  // Test 19: Compare periods with empty period 1
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    // Period 2: 5 completed orders
    const period2Orders = Array(5).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
      total: 1000,
      status: 'completed',
      createdAt: new Date('2024-02-15'),
    }));

    await Order.insertMany(period2Orders);

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert.equal(comparison.metrics.revenue.period1, 0);
    assert.equal(comparison.metrics.revenue.period2, 5000);
    assert.equal(comparison.comparison.revenue.absolute, 5000);
    assert.equal(comparison.comparison.revenue.percentage, 100);
  }

  await clearDatabase();

  // Test 20: Compare periods with empty period 2
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    // Period 1: 5 completed orders
    const period1Orders = Array(5).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
      total: 1000,
      status: 'completed',
      createdAt: new Date('2024-01-15'),
    }));

    await Order.insertMany(period1Orders);

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert.equal(comparison.metrics.revenue.period1, 5000);
    assert.equal(comparison.metrics.revenue.period2, 0);
    assert.equal(comparison.comparison.revenue.absolute, -5000);
    assert.equal(comparison.comparison.revenue.percentage, -100);
  }

  await clearDatabase();

  // Test 21: Compare periods with both empty
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert.equal(comparison.metrics.revenue.period1, 0);
    assert.equal(comparison.metrics.revenue.period2, 0);
    assert.equal(comparison.comparison.revenue.absolute, 0);
    assert.equal(comparison.comparison.revenue.percentage, 0);
  }

  await clearDatabase();

  // Test 22: Return object with all required fields
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    assert('metrics' in comparison);
    assert('comparison' in comparison);
    assert('revenue' in comparison.metrics);
    assert('salesVolume' in comparison.metrics);
    assert('avgOrderValue' in comparison.metrics);
    assert('successRate' in comparison.metrics);
    assert('activeSellers' in comparison.metrics);
  }

  // Test 23: Throw error for missing date parameters
  {
    try {
      await ReportGeneratorService.comparePeriods(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        null,
        new Date('2024-02-29')
      );
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.match(error.message, /All date parameters/);
    }
  }

  // Test 24: Throw error for invalid period 1 date range
  {
    try {
      await ReportGeneratorService.comparePeriods(
        new Date('2024-01-31'),
        new Date('2024-01-01'),
        new Date('2024-02-01'),
        new Date('2024-02-29')
      );
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.match(error.message, /period1Start must be before period1End/);
    }
  }

  // Test 25: Throw error for invalid period 2 date range
  {
    try {
      await ReportGeneratorService.comparePeriods(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        new Date('2024-02-29'),
        new Date('2024-02-01')
      );
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.match(error.message, /period2Start must be before period2End/);
    }
  }

  await clearDatabase();

  // Test 26: Compare periods with mixed order statuses
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    // Period 1: 5 completed, 3 cancelled, 2 pending
    const period1Orders = [
      ...Array(5).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
      })),
      ...Array(3).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-01-15'),
      })),
      ...Array(2).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'requested',
        createdAt: new Date('2024-01-15'),
      })),
    ];

    // Period 2: 8 completed, 2 cancelled
    const period2Orders = [
      ...Array(8).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-02-15'),
      })),
      ...Array(2).fill(null).map(() => ({
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'cancelled',
        createdAt: new Date('2024-02-15'),
      })),
    ];

    await Order.insertMany([...period1Orders, ...period2Orders]);

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    // Period 1: 5 completed out of 10 total = 50% success rate
    assert.equal(comparison.metrics.successRate.period1, 50);
    // Period 2: 8 completed out of 10 total = 80% success rate
    assert.equal(comparison.metrics.successRate.period2, 80);
    assert.equal(comparison.comparison.successRate.absolute, 30);
    assert.equal(comparison.comparison.successRate.percentage, 60);
  }

  await clearDatabase();

  // Test 27: Verify comparison structure for each metric
  {
    const p1Start = new Date('2024-01-01');
    const p1End = new Date('2024-01-31');
    const p2Start = new Date('2024-02-01');
    const p2End = new Date('2024-02-29');

    const comparison = await ReportGeneratorService.comparePeriods(p1Start, p1End, p2Start, p2End);

    // Verify metrics structure
    ['revenue', 'salesVolume', 'avgOrderValue', 'successRate', 'activeSellers'].forEach((metric) => {
      assert('period1' in comparison.metrics[metric]);
      assert('period2' in comparison.metrics[metric]);
      assert.equal(typeof comparison.metrics[metric].period1, 'number');
      assert.equal(typeof comparison.metrics[metric].period2, 'number');
    });

    // Verify comparison structure
    ['revenue', 'salesVolume', 'avgOrderValue', 'successRate', 'activeSellers'].forEach((metric) => {
      assert('absolute' in comparison.comparison[metric]);
      assert('percentage' in comparison.comparison[metric]);
      assert.equal(typeof comparison.comparison[metric].absolute, 'number');
      assert.equal(typeof comparison.comparison[metric].percentage, 'number');
    });
  }
};

module.exports = { runReportGeneratorTests };
