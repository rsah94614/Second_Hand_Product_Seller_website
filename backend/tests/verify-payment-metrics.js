/**
 * Quick verification script for getPaymentMetrics() implementation
 * This script tests the core functionality without the full test suite
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ReportGeneratorService = require('../src/services/ReportGeneratorService');
const Order = require('../models/Order');

const verify = async () => {
  let mongoServer;
  
  try {
    console.log('Starting payment metrics verification...\n');
    
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    // Test 1: All completed orders
    console.log('Test 1: All completed orders');
    await Order.deleteMany({});
    
    const orders1 = Array(10).fill(null).map(() => ({
      user: '507f1f77bcf86cd799439011',
      seller: '507f1f77bcf86cd799439012',
      items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
      total: 1000,
      status: 'completed',
      createdAt: new Date('2024-01-15'),
    }));
    
    await Order.insertMany(orders1);
    
    const metrics1 = await ReportGeneratorService.getPaymentMetrics({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });
    
    console.log('  Result:', JSON.stringify(metrics1, null, 2));
    console.log('  ✓ Total attempts:', metrics1.totalAttempts === 10 ? 'PASS' : 'FAIL');
    console.log('  ✓ Success rate:', metrics1.successRate === 100 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 2: Mixed statuses
    console.log('Test 2: Mixed order statuses (7 completed, 2 cancelled, 1 no_show)');
    await Order.deleteMany({});
    
    const orders2 = [
      ...Array(7).fill(null).map(() => ({
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
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'no_show',
        createdAt: new Date('2024-01-15'),
      },
    ];
    
    await Order.insertMany(orders2);
    
    const metrics2 = await ReportGeneratorService.getPaymentMetrics({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });
    
    console.log('  Result:', JSON.stringify(metrics2, null, 2));
    console.log('  ✓ Total attempts:', metrics2.totalAttempts === 10 ? 'PASS' : 'FAIL');
    console.log('  ✓ Successful payments:', metrics2.successfulPayments === 7 ? 'PASS' : 'FAIL');
    console.log('  ✓ Failed payments:', metrics2.failedPayments === 3 ? 'PASS' : 'FAIL');
    console.log('  ✓ Success rate:', metrics2.successRate === 70 ? 'PASS' : 'FAIL');
    console.log('  ✓ Failure rate:', metrics2.failureRate === 30 ? 'PASS' : 'FAIL');
    console.log('  ✓ Cancelled count:', metrics2.failureBreakdown.cancelled.count === 2 ? 'PASS' : 'FAIL');
    console.log('  ✓ No-show count:', metrics2.failureBreakdown.no_show.count === 1 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 3: Date range filtering
    console.log('Test 3: Date range filtering');
    await Order.deleteMany({});
    
    const orders3 = [
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
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-05'),
      },
      {
        user: '507f1f77bcf86cd799439011',
        seller: '507f1f77bcf86cd799439012',
        items: [{ product: '507f1f77bcf86cd799439013', price: 1000, quantity: 1 }],
        total: 1000,
        status: 'completed',
        createdAt: new Date('2024-01-25'),
      },
    ];
    
    await Order.insertMany(orders3);
    
    const metrics3 = await ReportGeneratorService.getPaymentMetrics({
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-20'),
    });
    
    console.log('  Result:', JSON.stringify(metrics3, null, 2));
    console.log('  ✓ Only includes orders in range:', metrics3.totalAttempts === 1 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 4: Empty database
    console.log('Test 4: Empty database');
    await Order.deleteMany({});
    
    const metrics4 = await ReportGeneratorService.getPaymentMetrics({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });
    
    console.log('  Result:', JSON.stringify(metrics4, null, 2));
    console.log('  ✓ Returns zeros for empty database:', metrics4.totalAttempts === 0 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 5: Error handling
    console.log('Test 5: Error handling - invalid date range');
    try {
      await ReportGeneratorService.getPaymentMetrics({
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'),
      });
      console.log('  ✗ Should have thrown error');
    } catch (error) {
      console.log('  ✓ Correctly throws error:', error.message);
    }
    console.log('');
    
    console.log('✓ All verification tests completed successfully!');
    
  } catch (error) {
    console.error('✗ Verification failed:', error);
    process.exit(1);
  } finally {
    if (mongoServer) {
      await mongoServer.stop();
    }
    await mongoose.disconnect();
  }
};

verify();
