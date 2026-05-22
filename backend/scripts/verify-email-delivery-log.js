/**
 * Verify EmailDeliveryLog Collection Script
 * 
 * This script verifies that the EmailDeliveryLog collection is properly set up
 * with all required indexes on jobId, adminId, and status (finalStatus).
 * 
 * Usage: node scripts/verify-email-delivery-log.js
 * 
 * **Validates: Requirements 9, 17, 19 (Email delivery, email specifications, monitoring)**
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import model
const EmailDeliveryLog = require('../models/EmailDeliveryLog');

async function verifyEmailDeliveryLog() {
  try {
    console.log('🔍 Verifying EmailDeliveryLog Collection...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusmitra');
    console.log('✅ Connected to MongoDB\n');

    // Check collection existence
    console.log('📊 Collection Verification:');
    console.log('─'.repeat(80));
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (collectionNames.includes('emaildeliverylogs')) {
      console.log('✅ EmailDeliveryLog collection exists');
    } else {
      console.log('❌ EmailDeliveryLog collection NOT found');
      return false;
    }

    // Get all indexes
    const indexes = await EmailDeliveryLog.collection.getIndexes();
    const indexNames = Object.keys(indexes);

    console.log(`\n📋 Current Indexes (${indexNames.length}):`);
    indexNames.forEach((name) => {
      console.log(`  • ${name}`);
    });

    // Verify required indexes
    console.log('\n✅ Required Indexes Verification:');
    console.log('─'.repeat(80));

    const requiredIndexes = [
      { name: 'jobId_1', description: 'Index on jobId' },
      { name: 'adminId_1', description: 'Index on adminId' },
      { name: 'finalStatus_1', description: 'Index on finalStatus (status)' },
      { name: 'jobId_1_adminId_1_finalStatus_1', description: 'Compound index (jobId, adminId, finalStatus)' },
      { name: 'adminId_1_createdAt_-1', description: 'Compound index (adminId, createdAt)' },
      { name: 'finalStatus_1_createdAt_-1', description: 'Compound index (finalStatus, createdAt)' },
      { name: 'messageId_1', description: 'Index on messageId' }
    ];

    let allPresent = true;
    requiredIndexes.forEach(idx => {
      if (indexNames.includes(idx.name)) {
        console.log(`✅ ${idx.description}`);
      } else {
        console.log(`❌ MISSING: ${idx.description}`);
        allPresent = false;
      }
    });

    // Test data storage
    console.log('\n📝 Data Storage Test:');
    console.log('─'.repeat(80));

    const testAdminId = new mongoose.Types.ObjectId();
    const testDeliveryLog = new EmailDeliveryLog({
      jobId: 'test-job-' + Date.now(),
      adminId: testAdminId,
      email: 'test@example.com',
      reportType: 'weekly-summary',
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07')
      },
      attempts: [
        {
          attemptNumber: 1,
          timestamp: new Date(),
          status: 'sent',
          error: ''
        }
      ],
      finalStatus: 'delivered',
      messageId: 'test-msg-' + Date.now()
    });

    try {
      const saved = await testDeliveryLog.save();
      console.log('✅ Successfully created test delivery log entry');
      console.log(`   ID: ${saved._id}`);
      console.log(`   jobId: ${saved.jobId}`);
      console.log(`   adminId: ${saved.adminId}`);
      console.log(`   finalStatus: ${saved.finalStatus}`);

      // Test retrieval by jobId
      const byJobId = await EmailDeliveryLog.findOne({ jobId: saved.jobId });
      if (byJobId) {
        console.log('✅ Successfully retrieved by jobId');
      } else {
        console.log('❌ Failed to retrieve by jobId');
        allPresent = false;
      }

      // Test retrieval by adminId
      const byAdminId = await EmailDeliveryLog.findOne({ adminId: testAdminId });
      if (byAdminId) {
        console.log('✅ Successfully retrieved by adminId');
      } else {
        console.log('❌ Failed to retrieve by adminId');
        allPresent = false;
      }

      // Test retrieval by finalStatus
      const byStatus = await EmailDeliveryLog.findOne({ finalStatus: 'delivered' });
      if (byStatus) {
        console.log('✅ Successfully retrieved by finalStatus');
      } else {
        console.log('❌ Failed to retrieve by finalStatus');
        allPresent = false;
      }

      // Clean up test data
      await EmailDeliveryLog.deleteOne({ _id: saved._id });
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log('❌ Error during data storage test:', error.message);
      allPresent = false;
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 Summary:\n');

    if (allPresent) {
      console.log('✅ EmailDeliveryLog collection is properly configured!');
      console.log('\n✅ Verification Results:');
      console.log('  • Collection exists: YES');
      console.log('  • Index on jobId: YES');
      console.log('  • Index on adminId: YES');
      console.log('  • Index on finalStatus (status): YES');
      console.log('  • Compound indexes: YES');
      console.log('  • Data storage: YES');
      console.log('  • Data retrieval: YES');
      console.log('\n✅ All acceptance criteria satisfied!');
      return true;
    } else {
      console.log('❌ EmailDeliveryLog collection verification failed!');
      console.log('  Some required indexes or functionality are missing.');
      return false;
    }

  } catch (error) {
    console.error('❌ Error verifying EmailDeliveryLog:', error.message);
    console.error(error);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

// Run verification
if (require.main === module) {
  verifyEmailDeliveryLog()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = verifyEmailDeliveryLog;
