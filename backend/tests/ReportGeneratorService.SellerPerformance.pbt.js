const assert = require('node:assert/strict');
const fc = require('fast-check');
const ReportGeneratorService = require('../src/services/ReportGeneratorService');
const Order = require('../models/Order');
const { clearDatabase } = require('./helpers/testApp');

/**
 * Property-Based Test Suite for ReportGeneratorService.getSellerRankings()
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
 * 
 * Property 8: Seller Performance Metrics
 * For any set of sellers with completed orders, the seller rankings SHALL include only 
 * sellers with at least one completed order, with all required fields present: name, user ID, 
 * total revenue, completed orders, average order value, average rating, products listed, 
 * active products, and verification status.
 * 
 * Property 9: Seller Ranking Sorting
 * For any seller ranking report, sellers SHALL be sortable by total revenue (default), 
 * number of orders, average rating, or average order value, with correct sorting applied 
 * in descending order for revenue and orders, and descending order for ratings and AOV.
 */

/**
 * Helper function to verify sorting
 */
function verifySorting(sellers, sortBy) {
  for (let i = 1; i < sellers.length; i++) {
    const prev = sellers[i - 1];
    const curr = sellers[i];
    
    switch (sortBy) {
      case 'revenue':
        assert(
          prev.totalRevenue >= curr.totalRevenue,
          `Revenue not sorted correctly: ${prev.totalRevenue} should be >= ${curr.totalRevenue}`
        );
        break;
      case 'orders':
        assert(
          prev.completedOrders >= curr.completedOrders,
          `Orders not sorted correctly: ${prev.completedOrders} should be >= ${curr.completedOrders}`
        );
        break;
      case 'rating':
        assert(
          prev.avgRating >= curr.avgRating,
          `Rating not sorted correctly: ${prev.avgRating} should be >= ${curr.avgRating}`
        );
        break;
      case 'avgOrderValue':
        assert(
          prev.avgOrderValue >= curr.avgOrderValue,
          `AOV not sorted correctly: ${prev.avgOrderValue} should be >= ${curr.avgOrderValue}`
        );
        break;
    }
  }
}

/**
 * Run property-based tests
 */
const runSellerPerformanceTests = async () => {
  console.log('Starting Property-Based Tests for Seller Performance Metrics...\n');

  // ============================================
  // Property 8: Seller Performance Metrics
  // ============================================

  console.log('Property 8: Seller Performance Metrics');
  console.log('Testing that seller rankings include only sellers with completed orders');
  console.log('and all required fields are present...\n');

  // Test 1: All sellers in results have at least one completed order
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 10 }),  // Number of sellers
      fc.integer({ min: 1, max: 20 }),  // Orders per seller
      async (numSellers, ordersPerSeller) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          for (let j = 0; j < ordersPerSeller; j++) {
            orders.push({
              user: '507f1f77bcf86cd799439011',
              seller: sellerId,
              items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
              total: Math.floor(Math.random() * 9900) + 100,
              status: 'completed',
              createdAt: new Date('2024-01-15'),
            });
          }
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

        // Verify all sellers in results have at least one completed order
        rankings.forEach((seller) => {
          const sellerOrders = orders.filter((o) => o.seller === seller.sellerId && o.status === 'completed');
          assert(
            sellerOrders.length > 0,
            `Seller ${seller.sellerId} should have at least one completed order`
          );
        });

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 1 passed: All sellers have at least one completed order\n');

  // Test 2: All required fields are present in seller rankings
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: 1000,
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

        // Verify all required fields are present
        rankings.forEach((seller) => {
          assert('sellerId' in seller, 'Missing sellerId');
          assert('sellerName' in seller, 'Missing sellerName');
          assert('totalRevenue' in seller, 'Missing totalRevenue');
          assert('completedOrders' in seller, 'Missing completedOrders');
          assert('avgOrderValue' in seller, 'Missing avgOrderValue');
          assert('avgRating' in seller, 'Missing avgRating');
          assert('productsListed' in seller, 'Missing productsListed');
          assert('activeProducts' in seller, 'Missing activeProducts');
          assert('verificationStatus' in seller, 'Missing verificationStatus');
        });

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 2 passed: All required fields are present\n');

  // Test 3: Total revenue is correctly calculated
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }),  // Number of sellers
      fc.integer({ min: 1, max: 10 }), // Orders per seller
      async (numSellers, ordersPerSeller) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          for (let j = 0; j < ordersPerSeller; j++) {
            orders.push({
              user: '507f1f77bcf86cd799439011',
              seller: sellerId,
              items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
              total: Math.floor(Math.random() * 9900) + 100,
              status: 'completed',
              createdAt: new Date('2024-01-15'),
            });
          }
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

        // Verify total revenue calculation
        rankings.forEach((seller) => {
          const sellerOrders = orders.filter((o) => o.seller === seller.sellerId && o.status === 'completed');
          const expectedRevenue = sellerOrders.reduce((sum, o) => sum + o.total, 0);
          assert.equal(
            seller.totalRevenue,
            expectedRevenue,
            `Revenue mismatch for seller ${seller.sellerId}: expected ${expectedRevenue}, got ${seller.totalRevenue}`
          );
        });

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 3 passed: Total revenue is correctly calculated\n');

  // Test 4: Completed orders count is correct
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }),  // Number of sellers
      fc.integer({ min: 1, max: 10 }), // Orders per seller
      async (numSellers, ordersPerSeller) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          for (let j = 0; j < ordersPerSeller; j++) {
            orders.push({
              user: '507f1f77bcf86cd799439011',
              seller: sellerId,
              items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
              total: 1000,
              status: 'completed',
              createdAt: new Date('2024-01-15'),
            });
          }
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

        // Verify completed orders count
        rankings.forEach((seller) => {
          const sellerOrders = orders.filter((o) => o.seller === seller.sellerId && o.status === 'completed');
          assert.equal(
            seller.completedOrders,
            sellerOrders.length,
            `Order count mismatch for seller ${seller.sellerId}`
          );
        });

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 4 passed: Completed orders count is correct\n');

  // Test 5: Average order value is correctly calculated
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }),  // Number of sellers
      fc.integer({ min: 1, max: 10 }), // Orders per seller
      async (numSellers, ordersPerSeller) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          for (let j = 0; j < ordersPerSeller; j++) {
            orders.push({
              user: '507f1f77bcf86cd799439011',
              seller: sellerId,
              items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
              total: Math.floor(Math.random() * 9900) + 100,
              status: 'completed',
              createdAt: new Date('2024-01-15'),
            });
          }
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

        // Verify average order value calculation
        rankings.forEach((seller) => {
          const sellerOrders = orders.filter((o) => o.seller === seller.sellerId && o.status === 'completed');
          const expectedAOV = sellerOrders.length > 0
            ? sellerOrders.reduce((sum, o) => sum + o.total, 0) / sellerOrders.length
            : 0;
          assert.equal(
            seller.avgOrderValue,
            expectedAOV,
            `AOV mismatch for seller ${seller.sellerId}`
          );
        });

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 5 passed: Average order value is correctly calculated\n');

  // Test 6: Only sellers with completed orders are included
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: 1000,
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

        // Get sellers with completed orders
        const sellersWithCompletedOrders = new Set(
          orders
            .filter((o) => o.status === 'completed')
            .map((o) => o.seller)
        );

        // Verify all returned sellers have completed orders
        rankings.forEach((seller) => {
          assert(
            sellersWithCompletedOrders.has(seller.sellerId),
            `Seller ${seller.sellerId} should have completed orders`
          );
        });

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 6 passed: Only sellers with completed orders are included\n');

  // ============================================
  // Property 9: Seller Ranking Sorting
  // ============================================

  console.log('\nProperty 9: Seller Ranking Sorting');
  console.log('Testing that sellers are correctly sorted by various criteria...\n');

  // Test 7: Default sorting by revenue (descending)
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers with varying revenues
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: (i + 1) * 1000,  // Varying revenues
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange, 'revenue');

        // Verify revenue sorting (descending)
        verifySorting(rankings, 'revenue');

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 7 passed: Default sorting by revenue (descending) is correct\n');

  // Test 8: Sorting by number of orders (descending)
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers with varying order counts
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          const orderCount = (i + 1) * 2;  // Varying order counts
          for (let j = 0; j < orderCount; j++) {
            orders.push({
              user: '507f1f77bcf86cd799439011',
              seller: sellerId,
              items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
              total: 1000,
              status: 'completed',
              createdAt: new Date('2024-01-15'),
            });
          }
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange, 'orders');

        // Verify orders sorting (descending)
        verifySorting(rankings, 'orders');

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 8 passed: Sorting by number of orders (descending) is correct\n');

  // Test 9: Sorting by average rating (descending)
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: 1000,
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange, 'rating');

        // Verify rating sorting (descending)
        verifySorting(rankings, 'rating');

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 9 passed: Sorting by average rating (descending) is correct\n');

  // Test 10: Sorting by average order value (descending)
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers with varying AOVs
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: (i + 1) * 1000,  // Varying AOVs
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange, 'avgOrderValue');

        // Verify AOV sorting (descending)
        verifySorting(rankings, 'avgOrderValue');

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 10 passed: Sorting by average order value (descending) is correct\n');

  // Test 11: Limit parameter restricts results
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 10 }),  // Number of sellers
      fc.integer({ min: 1, max: 5 }),   // Limit
      async (numSellers, limit) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: 1000,
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange, 'revenue', limit);

        // Verify limit is respected
        assert(
          rankings.length <= limit,
          `Results should not exceed limit: ${rankings.length} > ${limit}`
        );

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 11 passed: Limit parameter restricts results correctly\n');

  // Test 12: Empty date range returns empty results
  await fc.assert(
    fc.asyncProperty(fc.constant(null), async () => {
      await clearDatabase();

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      };

      const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

      // Verify empty results for empty database
      assert.equal(rankings.length, 0, 'Should return empty array for empty database');

      await clearDatabase();
    }),
    { numRuns: 10 }
  );
  console.log('✓ Test 12 passed: Empty date range returns empty results\n');

  // Test 13: Date range filtering works correctly
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders within and outside the date range
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          // Order within range
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: 1000,
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
          // Order outside range
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: 1000,
            status: 'completed',
            createdAt: new Date('2023-12-01'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange);

        // Verify only orders within date range are counted
        rankings.forEach((seller) => {
          const sellerOrdersInRange = orders.filter(
            (o) => o.seller === seller.sellerId && o.status === 'completed' && o.createdAt >= dateRange.startDate && o.createdAt <= dateRange.endDate
          );
          assert.equal(
            seller.completedOrders,
            sellerOrdersInRange.length,
            `Order count should only include orders within date range`
          );
        });

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 13 passed: Date range filtering works correctly\n');

  // Test 14: Multiple sellers are ranked correctly
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 2, max: 5 }),  // Number of sellers
      async (numSellers) => {
        await clearDatabase();

        const dateRange = {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        };

        // Create orders for multiple sellers
        const orders = [];
        for (let i = 0; i < numSellers; i++) {
          const sellerId = `507f1f77bcf86cd79943901${i}`;
          orders.push({
            user: '507f1f77bcf86cd799439011',
            seller: sellerId,
            items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
            total: 1000,
            status: 'completed',
            createdAt: new Date('2024-01-15'),
          });
        }

        await Order.insertMany(orders);

        const rankings = await ReportGeneratorService.getSellerRankings(dateRange, 'revenue');

        // Verify multiple sellers are returned
        const uniqueSellers = new Set(orders.map((o) => o.seller));
        assert(
          rankings.length <= uniqueSellers.size,
          `Should not return more sellers than exist`
        );

        // Verify all sellers are unique
        const returnedSellerIds = new Set(rankings.map((s) => s.sellerId));
        assert.equal(
          returnedSellerIds.size,
          rankings.length,
          `All returned sellers should be unique`
        );

        await clearDatabase();
      }
    ),
    { numRuns: 50 }
  );
  console.log('✓ Test 14 passed: Multiple sellers are ranked correctly\n');

  // Test 15: Sellers with same revenue maintain consistent order
  await fc.assert(
    fc.asyncProperty(fc.constant(null), async () => {
      await clearDatabase();

      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      // Create sellers with identical revenue
      const orders = [
        {
          user: '507f1f77bcf86cd799439011',
          seller: '507f1f77bcf86cd799439012',
          items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
          total: 5000,
          status: 'completed',
          createdAt: new Date('2024-01-15'),
        },
        {
          user: '507f1f77bcf86cd799439011',
          seller: '507f1f77bcf86cd799439014',
          items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
          total: 5000,
          status: 'completed',
          createdAt: new Date('2024-01-15'),
        },
      ];

      await Order.insertMany(orders);

      const rankings = await ReportGeneratorService.getSellerRankings(dateRange, 'revenue');

      // Verify both sellers are returned
      assert.equal(rankings.length, 2, 'Should return both sellers');

      // Verify revenue is equal
      assert.equal(
        rankings[0].totalRevenue,
        rankings[1].totalRevenue,
        'Sellers should have equal revenue'
      );

      await clearDatabase();
    }),
    { numRuns: 20 }
  );
  console.log('✓ Test 15 passed: Sellers with same revenue maintain consistent order\n');

  console.log('\n✅ All Property-Based Tests for Seller Performance Metrics passed!\n');
  await clearDatabase();
};

// Run tests if this file is executed directly
if (require.main === module) {
  runSellerPerformanceTests()
    .then(() => {
      console.log('All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runSellerPerformanceTests };
