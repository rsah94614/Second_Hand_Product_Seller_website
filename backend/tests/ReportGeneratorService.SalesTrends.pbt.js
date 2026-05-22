const assert = require('node:assert/strict');
const fc = require('fast-check');
const ReportGeneratorService = require('../src/services/ReportGeneratorService');
const Order = require('../models/Order');
const { clearDatabase } = require('./helpers/testApp');

/**
 * Property-Based Test Suite for ReportGeneratorService.getSalesTrends()
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 *
 * Property 7: Sales Trends Aggregation
 *
 * For any date range and granularity level (daily, weekly, monthly), the sales trends
 * SHALL correctly aggregate revenue, sales volume, and average order value for each period,
 * with week-over-week and month-over-month changes calculated correctly.
 *
 * Core properties tested:
 *  P7-A: Total revenue across all trend periods equals sum of individual period revenues
 *  P7-B: Trend periods are non-overlapping and cover the full date range
 *  P7-C: Daily granularity produces more (or equal) data points than weekly,
 *         which produces more (or equal) than monthly
 *  P7-D: Revenue values are non-negative for all periods
 */

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generate a date range within 2024 with at least 1 day difference.
 * Keeps the range ≤ 90 days so tests stay fast.
 */
const dateRangeArbitrary = () =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 274 }), // day offset from 2024-01-01
      fc.integer({ min: 1, max: 90 })   // span in days
    )
    .map(([startOffset, span]) => {
      const startDate = new Date('2024-01-01');
      startDate.setDate(startDate.getDate() + startOffset);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + span);

      // Clamp to 2024-12-31
      const yearEnd = new Date('2024-12-31');
      if (endDate > yearEnd) endDate.setTime(yearEnd.getTime());

      return { startDate, endDate };
    });

/**
 * Generate a single order whose createdAt falls within the given date range.
 */
const orderArbitrary = (dateRange) =>
  fc.record({
    user: fc.constant('507f1f77bcf86cd799439011'),
    seller: fc.constant('507f1f77bcf86cd799439012'),
    items: fc.constant([
      { product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 },
    ]),
    total: fc.integer({ min: 100, max: 10000 }),
    status: fc.constant('completed'),
    createdAt: fc.integer({
      min: dateRange.startDate.getTime(),
      max: dateRange.endDate.getTime(),
    }).map((t) => new Date(t)),
  });

/** Generate 0–50 orders within the date range. */
const ordersArbitrary = (dateRange) =>
  fc.array(orderArbitrary(dateRange), { minLength: 0, maxLength: 50 });

// ---------------------------------------------------------------------------
// Pure helper calculations (mirror the service logic, used for assertions)
// ---------------------------------------------------------------------------

function sumRevenue(orders) {
  return orders.reduce((acc, o) => acc + o.total, 0);
}

function groupByDay(orders) {
  const map = {};
  orders.forEach((o) => {
    const key = new Date(o.createdAt).toISOString().split('T')[0];
    if (!map[key]) map[key] = 0;
    map[key] += o.total;
  });
  return map;
}

function groupByWeek(orders) {
  const map = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    // MongoDB's $dayOfWeek: 1=Sunday, 2=Monday, ..., 7=Saturday
    // JavaScript's getUTCDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
    const jsDay = d.getUTCDay(); // 0 = Sunday
    const mongoDay = jsDay === 0 ? 1 : jsDay + 1; // Convert to MongoDB format
    const daysToSubtract = mongoDay === 1 ? 0 : mongoDay - 1; // If Sunday (1), subtract 0; else subtract (mongoDay - 1)
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - daysToSubtract);
    weekStart.setUTCHours(0, 0, 0, 0);
    const key = weekStart.toISOString().split('T')[0];
    if (!map[key]) map[key] = 0;
    map[key] += o.total;
  });
  return map;
}

function groupByMonth(orders) {
  const map = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = 0;
    map[key] += o.total;
  });
  return map;
}

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

const runSalesTrendsPBTTests = async () => {
  console.log(
    '\n=== Property-Based Tests for Sales Trends Aggregation (Property 7) ===\n'
  );

  // -----------------------------------------------------------------------
  // P7-A: Total revenue across all trend periods equals sum of order totals
  // -----------------------------------------------------------------------

  console.log(
    'P7-A: Total revenue across all trend periods equals sum of individual period revenues...'
  );

  // Daily
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(ordersArbitrary(dateRange), 1)[0];
      if (orders.length === 0) return true;

      await Order.insertMany(orders);

      const trends = await ReportGeneratorService.getSalesTrends(dateRange, 'daily');

      const trendTotal = trends.reduce((acc, t) => acc + (t.revenue || 0), 0);
      const orderTotal = sumRevenue(orders);

      assert.equal(
        trendTotal,
        orderTotal,
        `Daily: trend revenue sum (${trendTotal}) !== order total (${orderTotal})`
      );

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ Daily granularity: trend revenue sum equals order total\n');

  // Weekly
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(ordersArbitrary(dateRange), 1)[0];
      if (orders.length === 0) return true;

      await Order.insertMany(orders);

      const trends = await ReportGeneratorService.getSalesTrends(dateRange, 'weekly');

      const trendTotal = trends.reduce((acc, t) => acc + (t.revenue || 0), 0);
      const orderTotal = sumRevenue(orders);

      assert.equal(
        trendTotal,
        orderTotal,
        `Weekly: trend revenue sum (${trendTotal}) !== order total (${orderTotal})`
      );

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ Weekly granularity: trend revenue sum equals order total\n');

  // Monthly
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(ordersArbitrary(dateRange), 1)[0];
      if (orders.length === 0) return true;

      await Order.insertMany(orders);

      const trends = await ReportGeneratorService.getSalesTrends(dateRange, 'monthly');

      const trendTotal = trends.reduce((acc, t) => acc + (t.revenue || 0), 0);
      const orderTotal = sumRevenue(orders);

      assert.equal(
        trendTotal,
        orderTotal,
        `Monthly: trend revenue sum (${trendTotal}) !== order total (${orderTotal})`
      );

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ Monthly granularity: trend revenue sum equals order total\n');

  console.log('✓ P7-A passed: Total revenue across all trend periods equals sum of individual period revenues\n');

  // -----------------------------------------------------------------------
  // P7-B: Trend periods are non-overlapping and cover the full date range
  // -----------------------------------------------------------------------

  console.log(
    'P7-B: Trend periods are non-overlapping and cover the full date range...'
  );

  // Daily — each period key must be unique
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(ordersArbitrary(dateRange), 1)[0];
      if (orders.length === 0) return true;

      await Order.insertMany(orders);

      const trends = await ReportGeneratorService.getSalesTrends(dateRange, 'daily');

      // Non-overlapping: all date strings must be unique
      const dateKeys = trends.map((t) =>
        new Date(t.date).toISOString().split('T')[0]
      );
      const uniqueKeys = new Set(dateKeys);
      assert.equal(
        uniqueKeys.size,
        dateKeys.length,
        `Daily trends contain duplicate period keys: ${dateKeys}`
      );

      // Coverage: every order's date must appear in the trends
      const expectedDays = groupByDay(orders);
      Object.keys(expectedDays).forEach((day) => {
        assert(
          uniqueKeys.has(day),
          `Day ${day} has orders but is missing from daily trends`
        );
      });

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ Daily: periods are non-overlapping and cover all order dates\n');

  // Weekly — each weekStart must be unique
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(ordersArbitrary(dateRange), 1)[0];
      if (orders.length === 0) return true;

      await Order.insertMany(orders);

      const trends = await ReportGeneratorService.getSalesTrends(dateRange, 'weekly');

      const weekKeys = trends.map((t) =>
        new Date(t.weekStart).toISOString().split('T')[0]
      );
      const uniqueKeys = new Set(weekKeys);
      assert.equal(
        uniqueKeys.size,
        weekKeys.length,
        `Weekly trends contain duplicate period keys: ${weekKeys}`
      );

      // Coverage: every order's week must appear in the trends
      const expectedWeeks = groupByWeek(orders);
      Object.keys(expectedWeeks).forEach((week) => {
        assert(
          uniqueKeys.has(week),
          `Week ${week} has orders but is missing from weekly trends`
        );
      });

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ Weekly: periods are non-overlapping and cover all order weeks\n');

  // Monthly — each month key must be unique
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(ordersArbitrary(dateRange), 1)[0];
      if (orders.length === 0) return true;

      await Order.insertMany(orders);

      const trends = await ReportGeneratorService.getSalesTrends(dateRange, 'monthly');

      const monthKeys = trends.map((t) => t.month);
      const uniqueKeys = new Set(monthKeys);
      assert.equal(
        uniqueKeys.size,
        monthKeys.length,
        `Monthly trends contain duplicate period keys: ${monthKeys}`
      );

      // Coverage: every order's month must appear in the trends
      const expectedMonths = groupByMonth(orders);
      Object.keys(expectedMonths).forEach((month) => {
        assert(
          uniqueKeys.has(month),
          `Month ${month} has orders but is missing from monthly trends`
        );
      });

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ Monthly: periods are non-overlapping and cover all order months\n');

  console.log('✓ P7-B passed: Trend periods are non-overlapping and cover the full date range\n');

  // -----------------------------------------------------------------------
  // P7-C: Daily >= Weekly >= Monthly data points (granularity ordering)
  // -----------------------------------------------------------------------

  console.log(
    'P7-C: Daily granularity produces >= data points than weekly, which produces >= monthly...'
  );

  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      // Need at least a few orders spread across multiple days/weeks/months
      const orders = fc.sample(
        fc.array(orderArbitrary(dateRange), { minLength: 5, maxLength: 50 }),
        1
      )[0];

      await Order.insertMany(orders);

      const [daily, weekly, monthly] = await Promise.all([
        ReportGeneratorService.getSalesTrends(dateRange, 'daily'),
        ReportGeneratorService.getSalesTrends(dateRange, 'weekly'),
        ReportGeneratorService.getSalesTrends(dateRange, 'monthly'),
      ]);

      assert(
        daily.length >= weekly.length,
        `Daily (${daily.length}) should have >= data points than weekly (${weekly.length})`
      );

      // Only assert weekly >= monthly for ranges >= 62 days.
      // Short ranges straddling month boundaries (e.g. 4 days spanning 2 months)
      // can produce more monthly buckets than weekly buckets, so the invariant
      // only holds for longer spans where enough full weeks exist to cover all months.
      const diffDays = Math.ceil(Math.abs(dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24));
      if (diffDays >= 62) {
        assert(
          weekly.length >= monthly.length,
          `Weekly (${weekly.length}) should have >= data points than monthly (${monthly.length})`
        );
      }

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );

  console.log('✓ P7-C passed: Daily >= Weekly >= Monthly data points\n');

  // -----------------------------------------------------------------------
  // P7-D: Revenue values are non-negative for all periods
  // -----------------------------------------------------------------------

  console.log('P7-D: Revenue values are non-negative for all periods...');

  for (const granularity of ['daily', 'weekly', 'monthly']) {
    await fc.assert(
      fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
        await clearDatabase();

        const orders = fc.sample(ordersArbitrary(dateRange), 1)[0];
        if (orders.length === 0) return true;

        await Order.insertMany(orders);

        const trends = await ReportGeneratorService.getSalesTrends(
          dateRange,
          granularity
        );

        trends.forEach((t) => {
          assert(
            t.revenue >= 0,
            `${granularity} trend has negative revenue: ${t.revenue}`
          );
          assert(
            t.salesVolume >= 0,
            `${granularity} trend has negative salesVolume: ${t.salesVolume}`
          );
          assert(
            t.avgOrderValue >= 0,
            `${granularity} trend has negative avgOrderValue: ${t.avgOrderValue}`
          );
        });

        await clearDatabase();
        return true;
      }),
      { numRuns: 100 }
    );
    console.log(`  ✓ ${granularity}: all revenue/volume/AOV values are non-negative`);
  }

  console.log('\n✓ P7-D passed: Revenue values are non-negative for all periods\n');

  // -----------------------------------------------------------------------
  // Additional supporting properties (edge cases & field completeness)
  // -----------------------------------------------------------------------

  console.log('Additional: Edge cases and field completeness...');

  // Empty database → empty array for all granularities
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      for (const g of ['daily', 'weekly', 'monthly']) {
        const trends = await ReportGeneratorService.getSalesTrends(dateRange, g);
        assert(Array.isArray(trends), `${g}: result should be an array`);
        assert.equal(trends.length, 0, `${g}: empty DB should return empty array`);
      }

      return true;
    }),
    { numRuns: 50 }
  );
  console.log('  ✓ Empty database returns empty array for all granularities');

  // Required fields present in each granularity
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(
        fc.array(orderArbitrary(dateRange), { minLength: 1, maxLength: 20 }),
        1
      )[0];
      await Order.insertMany(orders);

      const daily = await ReportGeneratorService.getSalesTrends(dateRange, 'daily');
      daily.forEach((t) => {
        assert('date' in t, 'daily trend missing "date"');
        assert('revenue' in t, 'daily trend missing "revenue"');
        assert('salesVolume' in t, 'daily trend missing "salesVolume"');
        assert('avgOrderValue' in t, 'daily trend missing "avgOrderValue"');
        assert('transactions' in t, 'daily trend missing "transactions"');
      });

      const weekly = await ReportGeneratorService.getSalesTrends(dateRange, 'weekly');
      weekly.forEach((t) => {
        assert('weekStart' in t, 'weekly trend missing "weekStart"');
        assert('revenue' in t, 'weekly trend missing "revenue"');
        assert('salesVolume' in t, 'weekly trend missing "salesVolume"');
        assert('avgOrderValue' in t, 'weekly trend missing "avgOrderValue"');
        assert('weekOverWeekChange' in t, 'weekly trend missing "weekOverWeekChange"');
      });

      const monthly = await ReportGeneratorService.getSalesTrends(dateRange, 'monthly');
      monthly.forEach((t) => {
        assert('month' in t, 'monthly trend missing "month"');
        assert('revenue' in t, 'monthly trend missing "revenue"');
        assert('salesVolume' in t, 'monthly trend missing "salesVolume"');
        assert('avgOrderValue' in t, 'monthly trend missing "avgOrderValue"');
        assert('monthOverMonthChange' in t, 'monthly trend missing "monthOverMonthChange"');
      });

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ All required fields present in daily/weekly/monthly trends');

  // Orders outside date range are excluded
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const inRangeOrders = fc.sample(
        fc.array(orderArbitrary(dateRange), { minLength: 1, maxLength: 10 }),
        1
      )[0];

      const outsideOrders = [
        {
          user: '507f1f77bcf86cd799439011',
          seller: '507f1f77bcf86cd799439012',
          items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
          total: 99999,
          status: 'completed',
          createdAt: new Date(dateRange.startDate.getTime() - 86400000),
        },
        {
          user: '507f1f77bcf86cd799439011',
          seller: '507f1f77bcf86cd799439012',
          items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
          total: 99999,
          status: 'completed',
          createdAt: new Date(dateRange.endDate.getTime() + 86400000),
        },
      ];

      await Order.insertMany([...inRangeOrders, ...outsideOrders]);

      const trends = await ReportGeneratorService.getSalesTrends(dateRange, 'daily');
      const trendTotal = trends.reduce((acc, t) => acc + t.revenue, 0);
      const inRangeTotal = sumRevenue(inRangeOrders);

      assert.equal(
        trendTotal,
        inRangeTotal,
        `Out-of-range orders leaked into trends: trend=${trendTotal}, expected=${inRangeTotal}`
      );

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ Orders outside date range are excluded from trends');

  // avgOrderValue = revenue / transactions for each period
  await fc.assert(
    fc.asyncProperty(dateRangeArbitrary(), async (dateRange) => {
      await clearDatabase();

      const orders = fc.sample(
        fc.array(orderArbitrary(dateRange), { minLength: 1, maxLength: 30 }),
        1
      )[0];
      await Order.insertMany(orders);

      for (const g of ['daily', 'weekly', 'monthly']) {
        const trends = await ReportGeneratorService.getSalesTrends(dateRange, g);
        trends.forEach((t) => {
          if (t.transactions > 0) {
            // MongoDB $round uses banker's rounding (round-half-to-even) while
            // JS toFixed(2) uses round-half-up, so they can differ by 0.01
            // for values like X.125. We allow a tolerance of 0.01 (1 cent).
            const expectedExact = t.revenue / t.transactions;
            const diff = Math.abs(t.avgOrderValue - expectedExact);
            assert.ok(
              diff < 0.01,
              `${g}: avgOrderValue (${t.avgOrderValue}) is not within 0.01 of revenue/transactions (${expectedExact})`
            );
          }
        });
      }

      await clearDatabase();
      return true;
    }),
    { numRuns: 100 }
  );
  console.log('  ✓ avgOrderValue = revenue / transactions for every period');

  console.log('\n=== All Property-Based Tests for Sales Trends Aggregation (Property 7) Passed ===\n');
};

// Run directly with: node tests/ReportGeneratorService.SalesTrends.pbt.js
if (require.main === module) {
  const { setupTestApp, teardownTestApp } = require('./helpers/testApp');

  setupTestApp()
    .then(() => runSalesTrendsPBTTests())
    .then(() => {
      console.log('All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    })
    .finally(() => teardownTestApp());
}

module.exports = { runSalesTrendsPBTTests };
