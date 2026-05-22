/**
 * Create Report Indexes Migration Script
 * 
 * This script creates all necessary MongoDB collections and indexes for the
 * Sales & Revenue Reports feature, including:
 * - ReportSnapshot collection with TTL index for 2-year retention
 * - ReportAuditLog collection with indexes on adminId, action, timestamp
 * - EmailPreference collection with unique index on adminId
 * - EmailDeliveryLog collection with indexes on jobId, adminId, status
 * - Order model compound indexes for report queries
 * 
 * Usage: node scripts/create-report-indexes.js
 * 
 * **Validates: Requirements 12, 14, 15, 19 (Data accuracy, retention, access control, monitoring)**
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ReportSnapshot = require('../models/ReportSnapshot');
const ReportAuditLog = require('../models/ReportAuditLog');
const EmailPreference = require('../models/EmailPreference');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');
const Order = require('../models/Order');

async function createReportIndexes() {
  try {
    console.log('🔧 Creating Report Indexes...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusmitra');
    console.log('✅ Connected to MongoDB\n');

    // Create ReportSnapshot indexes
    console.log('📊 Creating ReportSnapshot indexes...');
    const reportSnapshotIndexes = await ReportSnapshot.collection.getIndexes();
    console.log('   Current indexes:', Object.keys(reportSnapshotIndexes));
    
    await ReportSnapshot.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('   ✅ TTL index created (2-year retention)');
    
    await ReportSnapshot.collection.createIndex({ reportType: 1, 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
    console.log('   ✅ Compound index created (reportType, dateRange)');
    
    await ReportSnapshot.collection.createIndex({ generatedBy: 1, reportType: 1, createdAt: -1 });
    console.log('   ✅ Compound index created (generatedBy, reportType, createdAt)');
    
    await ReportSnapshot.collection.createIndex({ status: 1, createdAt: -1 });
    console.log('   ✅ Index created (status, createdAt)\n');

    // Create ReportAuditLog indexes
    console.log('📋 Creating ReportAuditLog indexes...');
    const auditLogIndexes = await ReportAuditLog.collection.getIndexes();
    console.log('   Current indexes:', Object.keys(auditLogIndexes));
    
    await ReportAuditLog.collection.createIndex({ adminId: 1, action: 1, timestamp: -1 });
    console.log('   ✅ Compound index created (adminId, action, timestamp)');
    
    await ReportAuditLog.collection.createIndex({ adminId: 1, timestamp: -1 });
    console.log('   ✅ Index created (adminId, timestamp)');
    
    await ReportAuditLog.collection.createIndex({ action: 1, timestamp: -1 });
    console.log('   ✅ Index created (action, timestamp)');
    
    await ReportAuditLog.collection.createIndex({ 'details.status': 1, timestamp: -1 });
    console.log('   ✅ Index created (details.status, timestamp)\n');

    // Create EmailPreference indexes
    console.log('📧 Creating EmailPreference indexes...');
    const emailPrefIndexes = await EmailPreference.collection.getIndexes();
    console.log('   Current indexes:', Object.keys(emailPrefIndexes));
    
    await EmailPreference.collection.createIndex({ adminId: 1 }, { unique: true });
    console.log('   ✅ Unique index created (adminId)');
    
    await EmailPreference.collection.createIndex({ email: 1 });
    console.log('   ✅ Index created (email)');
    
    await EmailPreference.collection.createIndex({ subscribed: 1, frequency: 1 });
    console.log('   ✅ Index created (subscribed, frequency)');
    
    await EmailPreference.collection.createIndex({ lastEmailSent: 1, subscribed: 1 });
    console.log('   ✅ Index created (lastEmailSent, subscribed)\n');

    // Create EmailDeliveryLog indexes
    console.log('📬 Creating EmailDeliveryLog indexes...');
    const deliveryLogIndexes = await EmailDeliveryLog.collection.getIndexes();
    console.log('   Current indexes:', Object.keys(deliveryLogIndexes));
    
    await EmailDeliveryLog.collection.createIndex({ jobId: 1, adminId: 1, finalStatus: 1 });
    console.log('   ✅ Compound index created (jobId, adminId, finalStatus)');
    
    await EmailDeliveryLog.collection.createIndex({ adminId: 1, createdAt: -1 });
    console.log('   ✅ Index created (adminId, createdAt)');
    
    await EmailDeliveryLog.collection.createIndex({ finalStatus: 1, createdAt: -1 });
    console.log('   ✅ Index created (finalStatus, createdAt)');
    
    await EmailDeliveryLog.collection.createIndex({ finalStatus: 1, 'attempts.nextRetry': 1 });
    console.log('   ✅ Index created (finalStatus, attempts.nextRetry)');
    
    await EmailDeliveryLog.collection.createIndex({ messageId: 1 });
    console.log('   ✅ Index created (messageId)\n');

    // Create Order model compound indexes
    console.log('📦 Creating Order model indexes...');
    const orderIndexes = await Order.collection.getIndexes();
    console.log('   Current indexes:', Object.keys(orderIndexes));
    
    await Order.collection.createIndex({ status: 1, createdAt: -1 });
    console.log('   ✅ Index created (status, createdAt)');
    
    await Order.collection.createIndex({ seller: 1, status: 1, createdAt: -1 });
    console.log('   ✅ Compound index created (seller, status, createdAt)');
    
    await Order.collection.createIndex({ status: 1, 'items.product': 1, createdAt: -1 });
    console.log('   ✅ Compound index created (status, items.product, createdAt)');
    
    await Order.collection.createIndex({ status: 1, total: 1, createdAt: -1 });
    console.log('   ✅ Compound index created (status, total, createdAt)\n');

    // Verify all indexes
    console.log('🔍 Verifying all indexes...\n');
    
    const collections = [
      { name: 'ReportSnapshot', model: ReportSnapshot },
      { name: 'ReportAuditLog', model: ReportAuditLog },
      { name: 'EmailPreference', model: EmailPreference },
      { name: 'EmailDeliveryLog', model: EmailDeliveryLog },
      { name: 'Order', model: Order },
    ];

    for (const collection of collections) {
      const indexes = await collection.model.collection.getIndexes();
      console.log(`✅ ${collection.name}: ${Object.keys(indexes).length} indexes`);
      Object.entries(indexes).forEach(([name, spec]) => {
        console.log(`   - ${name}: ${JSON.stringify(spec.key)}`);
      });
      console.log();
    }

    console.log('✅ All indexes created successfully!\n');
    console.log('📊 Index Summary:');
    console.log('   • ReportSnapshot: TTL index for 2-year retention');
    console.log('   • ReportAuditLog: Indexes on adminId, action, timestamp');
    console.log('   • EmailPreference: Unique index on adminId');
    console.log('   • EmailDeliveryLog: Indexes on jobId, adminId, status');
    console.log('   • Order: Compound indexes for report queries');
    console.log('\n✅ Migration completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  createReportIndexes();
}

module.exports = createReportIndexes;
