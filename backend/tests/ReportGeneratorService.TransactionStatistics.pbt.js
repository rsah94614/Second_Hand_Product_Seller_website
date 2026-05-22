const assert = require('node:assert/strict');
const fc = require('fast-check');
const mongoose = require('mongoose');
const ReportGeneratorService = require('../src/services/ReportGeneratorService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { clearDatabase } = require('./helpers/testApp');

/**
 * Property-Based Test Suite for ReportGeneratorService.getTransactionMetrics()
 *
 * **Validates: Requirements 7.1, 7.3, 7.4, 7.5**
 *
 * Property 11: Transaction Statistics
 * For any set of completed orders with varying totals, the transaction metrics SHALL correctly
 * calculate average order value, median, minimum, maximum, and standard deviation, with
 * distribution across defined price ranges accurate.
 *
 * Property 12: Transaction Filtering by Category
 * For any category filter applied to transaction metrics, the report SHALL include only orders
 * containing products from the selected category, with all statistics recalculated for the
 * filtered subset.
 */

const DATE_RANGE = {
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2024-01-31T23:59:59.999Z'),
};

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbitraryOrder = fc.record({
  user: fc.constant('507f1f77bcf86cd799439011'),
  seller: fc.constant('507f1f77bcf86cd799439012'),
  items: fc.constant([
    { product: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), price: 1000, quantity: 1 },
  ]),
  total: fc.integer({ min: 1, max: 20000 }),
  status: fc.oneof(fc.constant('completed'), fc.constant('cancelled'), fc.constant('requested')),
  createdAt: fc.oneof(
    // Inside date range
    fc.integer({ min: DATE_RANGE.startDate.getTime(), max: DATE_RANGE.endDate.getTime() }).map((t) => new Date(t)),
    // Outside (before) date range
    fc.integer({ min: new Date('2023-11-01T00:00:00.000Z').getTime(), max: new Date('2023-12-31T23:59:59.999Z').getTime() }).map((t) => new Date(t)),
    // Outside (after) date range
    fc.integer({ min: new Date('2024-02-01T00:00:00.000Z').getTime(), max: new Date('2024-02-29T23:59:59.999Z').getTime() }).map((t) => new Date(t))
  ),
});

const arbitraryOrders = fc.array(arbitraryOrder, { minLength: 0, maxLength: 50 });

// ---------------------------------------------------------------------------
// Helper calculations for assertions
// ---------------------------------------------------------------------------

function calculateExpectedMetrics(orders, category = null, categoryMap = {}) {
  // Filter by date range and status = completed
  let filtered = orders.filter((o) => {
    const isCompleted = o.status === 'completed';
    const matchesDate = new Date(o.createdAt) >= DATE_RANGE.startDate && new Date(o.createdAt) <= DATE_RANGE.endDate;
    return isCompleted && matchesDate;
  });

  if (category) {
    filtered = filtered.filter((o) =>
      o.items.some((item) => {
        const prodId = item.product.toString();
        return categoryMap[prodId] === category;
      })
    );
  }

  const totals = filtered.map((o) => o.total);
  const count = totals.length;

  if (count === 0) {
    return {
      avgOrderValue: 0,
      medianOrderValue: 0,
      minOrderValue: 0,
      maxOrderValue: 0,
      stdDeviation: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      distribution: {
        '0-500': 0,
        '501-1000': 0,
        '1001-2500': 0,
        '2501-5000': 0,
        '5001-10000': 0,
        '10001+': 0,
      },
    };
  }

  const totalRevenue = totals.reduce((sum, t) => sum + t, 0);
  const avgOrderValue = parseFloat((totalRevenue / count).toFixed(2));

  const sorted = [...totals].sort((a, b) => a - b);
  let medianOrderValue;
  if (count % 2 === 0) {
    medianOrderValue = parseFloat(((sorted[count / 2 - 1] + sorted[count / 2]) / 2).toFixed(2));
  } else {
    medianOrderValue = sorted[Math.floor(count / 2)];
  }

  const minOrderValue = Math.min(...totals);
  const maxOrderValue = Math.max(...totals);

  const mean = totalRevenue / count;
  const squaredDiffs = totals.map((t) => Math.pow(t - mean, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / count;
  const stdDeviation = parseFloat(Math.sqrt(variance).toFixed(2));

  const distribution = {
    '0-500': 0,
    '501-1000': 0,
    '1001-2500': 0,
    '2501-5000': 0,
    '5001-10000': 0,
    '10001+': 0,
  };

  totals.forEach((t) => {
    if (t <= 500) distribution['0-500']++;
    else if (t <= 1000) distribution['501-1000']++;
    else if (t <= 2500) distribution['1001-2500']++;
    else if (t <= 5000) distribution['2501-5000']++;
    else if (t <= 10000) distribution['5001-10000']++;
    else distribution['10001+']++;
  });

  return {
    avgOrderValue,
    medianOrderValue,
    minOrderValue,
    maxOrderValue,
    stdDeviation,
    totalTransactions: count,
    totalRevenue,
    distribution,
  };
}

function assertMetricsEqual(actual, expected) {
  assert.equal(actual.totalTransactions, expected.totalTransactions, 'totalTransactions mismatch');
  assert.equal(actual.totalRevenue, expected.totalRevenue, 'totalRevenue mismatch');
  assert.equal(actual.avgOrderValue, expected.avgOrderValue, 'avgOrderValue mismatch');
  assert.equal(actual.medianOrderValue, expected.medianOrderValue, 'medianOrderValue mismatch');
  assert.equal(actual.minOrderValue, expected.minOrderValue, 'minOrderValue mismatch');
  assert.equal(actual.maxOrderValue, expected.maxOrderValue, 'maxOrderValue mismatch');
  assert.equal(actual.stdDeviation, expected.stdDeviation, 'stdDeviation mismatch');
  assert.deepEqual(actual.distribution, expected.distribution, 'distribution mismatch');
}

// ---------------------------------------------------------------------------
// Test Runner
// ---------------------------------------------------------------------------

const runTransactionStatisticsTests = async () => {
  console.log(
    '\n=== Property-Based Tests for Transaction Statistics (Properties 11-12) ===\n'
  );

  // -----------------------------------------------------------------------
  // Property 11: Transaction Statistics (General Stats Calculation)
  // -----------------------------------------------------------------------
  console.log('Property 11: Transaction Statistics...');

  await fc.assert(
    fc.asyncProperty(arbitraryOrders, async (generatedOrders) => {
      await clearDatabase();

      if (generatedOrders.length > 0) {
        await Order.insertMany(generatedOrders);
      }

      const actualMetrics = await ReportGeneratorService.getTransactionMetrics(DATE_RANGE);
      const expectedMetrics = calculateExpectedMetrics(generatedOrders);

      assertMetricsEqual(actualMetrics, expectedMetrics);

      await clearDatabase();
      return true;
    }),
    { numRuns: 50 }
  );
  console.log('  ✓ General transaction statistics correctly calculated\n');

  // -----------------------------------------------------------------------
  // Property 12: Transaction Filtering by Category
  // -----------------------------------------------------------------------
  console.log('Property 12: Transaction Filtering by Category...');

  const PRODUCTS = [
    {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd79943901a'),
      category: 'Electronics',
      title: 'Phone',
      price: 1000,
      description: 'Smartphone',
      condition: 'New',
      seller: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      images: ['img1'],
    },
    {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd79943901b'),
      category: 'Books',
      title: 'Novel',
      price: 500,
      description: 'Book novel',
      condition: 'New',
      seller: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      images: ['img2'],
    },
    {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd79943901c'),
      category: 'Clothing',
      title: 'Shirt',
      price: 800,
      description: 'Cotton shirt',
      condition: 'New',
      seller: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      images: ['img3'],
    },
  ];

  const categoryMap = {
    '507f1f77bcf86cd79943901a': 'Electronics',
    '507f1f77bcf86cd79943901b': 'Books',
    '507f1f77bcf86cd79943901c': 'Clothing',
  };

  const arbitraryOrderWithProduct = fc.record({
    user: fc.constant('507f1f77bcf86cd799439011'),
    seller: fc.constant('507f1f77bcf86cd799439012'),
    productIndex: fc.integer({ min: 0, max: PRODUCTS.length - 1 }),
    total: fc.integer({ min: 1, max: 20000 }),
    status: fc.oneof(fc.constant('completed'), fc.constant('cancelled'), fc.constant('requested')),
    createdAt: fc.oneof(
      // Inside date range
      fc.integer({ min: DATE_RANGE.startDate.getTime(), max: DATE_RANGE.endDate.getTime() }).map((t) => new Date(t)),
      // Outside (before) date range
      fc.integer({ min: new Date('2023-11-01T00:00:00.000Z').getTime(), max: new Date('2023-12-31T23:59:59.999Z').getTime() }).map((t) => new Date(t)),
      // Outside (after) date range
      fc.integer({ min: new Date('2024-02-01T00:00:00.000Z').getTime(), max: new Date('2024-02-29T23:59:59.999Z').getTime() }).map((t) => new Date(t))
    ),
  });

  const arbitraryOrdersWithProducts = fc.array(arbitraryOrderWithProduct, { minLength: 0, maxLength: 50 });

  await fc.assert(
    fc.asyncProperty(
      arbitraryOrdersWithProducts,
      fc.oneof(fc.constant('Electronics'), fc.constant('Books'), fc.constant('Clothing')),
      async (generatedOrders, filterCategory) => {
        await clearDatabase();
        await Product.insertMany(PRODUCTS);

        const ordersForDb = generatedOrders.map((go) => {
          const product = PRODUCTS[go.productIndex];
          return {
            user: new mongoose.Types.ObjectId(go.user),
            seller: new mongoose.Types.ObjectId(go.seller),
            items: [
              {
                product: product._id,
                price: product.price,
                quantity: 1,
                title: product.title,
              },
            ],
            total: go.total,
            status: go.status,
            createdAt: go.createdAt,
          };
        });

        if (ordersForDb.length > 0) {
          await Order.insertMany(ordersForDb);
        }

        const actualMetrics = await ReportGeneratorService.getTransactionMetrics(
          DATE_RANGE,
          filterCategory
        );
        const expectedMetrics = calculateExpectedMetrics(
          ordersForDb,
          filterCategory,
          categoryMap
        );

        assertMetricsEqual(actualMetrics, expectedMetrics);

        await clearDatabase();
        return true;
      }
    ),
    { numRuns: 50 }
  );
  console.log('  ✓ Category filtering and recalculation works as expected');

  // Test Non-Existent Category
  await fc.assert(
    fc.asyncProperty(arbitraryOrdersWithProducts, async (generatedOrders) => {
      await clearDatabase();
      await Product.insertMany(PRODUCTS);

      const ordersForDb = generatedOrders.map((go) => {
        const product = PRODUCTS[go.productIndex];
        return {
          user: new mongoose.Types.ObjectId(go.user),
          seller: new mongoose.Types.ObjectId(go.seller),
          items: [
            {
              product: product._id,
              price: product.price,
              quantity: 1,
              title: product.title,
            },
          ],
          total: go.total,
          status: go.status,
          createdAt: go.createdAt,
        };
      });

      if (ordersForDb.length > 0) {
        await Order.insertMany(ordersForDb);
      }

      const metrics = await ReportGeneratorService.getTransactionMetrics(
        DATE_RANGE,
        'NonExistentCategory'
      );

      assert.equal(
        metrics.totalTransactions,
        0,
        'Non-existent category should return 0 transactions'
      );
      assert.equal(
        metrics.totalRevenue,
        0,
        'Non-existent category should return 0 revenue'
      );

      await clearDatabase();
      return true;
    }),
    { numRuns: 50 }
  );
  console.log('  ✓ Non-existent category returns empty/zero results');

  console.log('\n✓ Property 12 passed: Transaction Filtering by Category\n');

  console.log(
    '=== All Property-Based Tests for Transaction Statistics (Properties 11-12) Passed ===\n'
  );
};

if (require.main === module) {
  const { setupTestApp, teardownTestApp } = require('./helpers/testApp');

  setupTestApp()
    .then(() => runTransactionStatisticsTests())
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

module.exports = { runTransactionStatisticsTests };
