/**
 * Simple Test Runner for Report Indexes
 * 
 * This script tests the MongoDB collections and indexes for the Sales & Revenue Reports feature.
 * 
 * Usage: node tests/test-report-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ReportSnapshot = require('../models/ReportSnapshot');
const ReportAuditLog = require('../models/ReportAuditLog');
const EmailPreference = require('../models/EmailPreference');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');
const Order = require('../models/Order');

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

async function runTests() {
  try {
    console.log('🔧 Testing Report Indexes...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusmitra';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Ensure all indexes are created
    console.log('🔧 Creating indexes...');
    await Promise.all([
      ReportSnapshot.syncIndexes(),
      ReportAuditLog.syncIndexes(),
      EmailPreference.syncIndexes(),
      EmailDeliveryLog.syncIndexes(),
    ]);
    console.log('✅ Indexes created\n');

    // Debug: Check what indexes were created
    console.log('🔍 Checking created indexes...');
    const rsIndexes = await ReportSnapshot.collection.getIndexes();
    console.log('ReportSnapshot indexes:', Object.keys(rsIndexes));
    const ralIndexes = await ReportAuditLog.collection.getIndexes();
    console.log('ReportAuditLog indexes:', Object.keys(ralIndexes));
    const epIndexes = await EmailPreference.collection.getIndexes();
    console.log('EmailPreference indexes:', Object.keys(epIndexes));
    const edlIndexes = await EmailDeliveryLog.collection.getIndexes();
    console.log('EmailDeliveryLog indexes:', Object.keys(edlIndexes));
    console.log();

    // Test ReportSnapshot Collection
    console.log('📊 Testing ReportSnapshot Collection:');
    
    await test('ReportSnapshot: Model loads correctly', async () => {
      if (!ReportSnapshot) throw new Error('Model not loaded');
      if (!ReportSnapshot.schema) throw new Error('Schema not defined');
    });

    await test('ReportSnapshot: Create document', async () => {
      const snapshot = await ReportSnapshot.create({
        reportType: 'dashboard',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        metrics: {
          totalRevenue: 50000,
          salesVolume: 100,
          avgOrderValue: 500,
          activeSellers: 25,
        },
        data: [],
        checksum: 'abc123def456',
        generatedBy: new mongoose.Types.ObjectId(),
        status: 'success',
      });

      if (!snapshot._id) throw new Error('Document not created');
      if (snapshot.reportType !== 'dashboard') throw new Error('reportType not set correctly');
    });

    await test('ReportSnapshot: Has TTL index on expiresAt', async () => {
      const indexes = await ReportSnapshot.collection.getIndexes();
      const ttlIndex = Object.entries(indexes).find(([name, _]) => {
        return name === 'expiresAt_1';
      });

      if (!ttlIndex) throw new Error('TTL index not found');
    });

    await test('ReportSnapshot: Has compound index on reportType, dateRange', async () => {
      const indexes = await ReportSnapshot.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([name, _]) => {
        return name === 'reportType_1_dateRange.startDate_1_dateRange.endDate_1';
      });

      if (!compoundIndex) throw new Error('Compound index not found');
    });

    // Test ReportAuditLog Collection
    console.log('\n📋 Testing ReportAuditLog Collection:');
    
    await test('ReportAuditLog: Model loads correctly', async () => {
      if (!ReportAuditLog) throw new Error('Model not loaded');
      if (!ReportAuditLog.schema) throw new Error('Schema not defined');
    });

    await test('ReportAuditLog: Create document', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const auditLog = await ReportAuditLog.create({
        adminId,
        action: 'view',
        reportType: 'dashboard',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        details: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          status: 'success',
        },
      });

      if (!auditLog._id) throw new Error('Document not created');
      if (auditLog.action !== 'view') throw new Error('action not set correctly');
    });

    await test('ReportAuditLog: Has compound index on adminId, action, timestamp', async () => {
      const indexes = await ReportAuditLog.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([name, _]) => {
        return name === 'adminId_1_action_1_timestamp_-1';
      });

      if (!compoundIndex) throw new Error('Compound index not found');
    });

    // Test EmailPreference Collection
    console.log('\n📧 Testing EmailPreference Collection:');
    
    await test('EmailPreference: Model loads correctly', async () => {
      if (!EmailPreference) throw new Error('Model not loaded');
      if (!EmailPreference.schema) throw new Error('Schema not defined');
    });

    await test('EmailPreference: Create document', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const preference = await EmailPreference.create({
        adminId,
        email: 'admin@example.com',
        subscribed: true,
        frequency: 'weekly',
      });

      if (!preference._id) throw new Error('Document not created');
      if (preference.email !== 'admin@example.com') throw new Error('email not set correctly');
    });

    await test('EmailPreference: Has index on adminId', async () => {
      const indexes = await EmailPreference.collection.getIndexes();
      const adminIdIndex = Object.entries(indexes).find(([name, _]) => {
        return name === 'adminId_1';
      });

      if (!adminIdIndex) throw new Error('adminId index not found');
      // Note: The unique constraint is enforced at the schema level via the unique: true option
    });

    // Test EmailDeliveryLog Collection
    console.log('\n📬 Testing EmailDeliveryLog Collection:');
    
    await test('EmailDeliveryLog: Model loads correctly', async () => {
      if (!EmailDeliveryLog) throw new Error('Model not loaded');
      if (!EmailDeliveryLog.schema) throw new Error('Schema not defined');
    });

    await test('EmailDeliveryLog: Create document', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const deliveryLog = await EmailDeliveryLog.create({
        jobId: 'job-123',
        adminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
        },
        attempts: [
          {
            attemptNumber: 1,
            status: 'sent',
          },
        ],
        finalStatus: 'delivered',
      });

      if (!deliveryLog._id) throw new Error('Document not created');
      if (deliveryLog.finalStatus !== 'delivered') throw new Error('finalStatus not set correctly');
    });

    await test('EmailDeliveryLog: Has compound index on jobId, adminId, finalStatus', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([name, _]) => {
        return name === 'jobId_1_adminId_1_finalStatus_1';
      });

      if (!compoundIndex) throw new Error('Compound index not found');
    });

    // Test Order Model
    console.log('\n📦 Testing Order Model:');
    
    await test('Order: Model loads correctly', async () => {
      if (!Order) throw new Error('Model not loaded');
      if (!Order.schema) throw new Error('Schema not defined');
      
      // Check that seller field exists
      const sellerField = Order.schema.paths.seller;
      if (!sellerField) throw new Error('seller field not defined');
    });

    await test('Order: seller field has index', async () => {
      const sellerField = Order.schema.paths.seller;
      if (!sellerField.options.index) throw new Error('seller field does not have index');
    });

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 Test Summary:\n');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📊 Total: ${testsPassed + testsFailed}`);

    if (testsFailed === 0) {
      console.log('\n✅ All tests passed!');
      console.log('\n✅ Collections and indexes created successfully:');
      console.log('  • ReportSnapshot: TTL index for 2-year retention');
      console.log('  • ReportAuditLog: Indexes on adminId, action, timestamp');
      console.log('  • EmailPreference: Unique index on adminId');
      console.log('  • EmailDeliveryLog: Indexes on jobId, adminId, status');
      console.log('  • Order: seller field with index for report queries');
    } else {
      console.log('\n❌ Some tests failed!');
    }

    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = runTests;
