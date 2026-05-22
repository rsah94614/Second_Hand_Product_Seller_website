/**
 * Verify Report Indexes Script
 * 
 * This script verifies that all required indexes for the Sales & Revenue Reports
 * feature are properly defined and provides diagnostic information.
 * 
 * Usage: node scripts/verify-report-indexes.js
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

async function verifyReportIndexes() {
  try {
    console.log('🔍 Verifying Report Indexes...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusmitra');
    console.log('✅ Connected to MongoDB\n');

    // Define expected indexes for each collection
    const expectedIndexes = {
      ReportSnapshot: {
        model: ReportSnapshot,
        indexes: [
          { name: 'expiresAt_1', key: { expiresAt: 1 }, description: 'TTL index for 2-year retention' },
          { name: 'reportType_1_dateRange.startDate_1_dateRange.endDate_1', key: { reportType: 1, 'dateRange.startDate': 1, 'dateRange.endDate': 1 }, description: 'Compound index for report type and date range' },
          { name: 'generatedBy_1_reportType_1_createdAt_-1', key: { generatedBy: 1, reportType: 1, createdAt: -1 }, description: 'Compound index for admin, report type, and creation date' },
          { name: 'status_1_createdAt_-1', key: { status: 1, createdAt: -1 }, description: 'Index for status and creation date' },
        ],
      },
      ReportAuditLog: {
        model: ReportAuditLog,
        indexes: [
          { name: 'adminId_1_action_1_timestamp_-1', key: { adminId: 1, action: 1, timestamp: -1 }, description: 'Compound index for admin, action, and timestamp' },
          { name: 'adminId_1_timestamp_-1', key: { adminId: 1, timestamp: -1 }, description: 'Index for admin and timestamp' },
          { name: 'action_1_timestamp_-1', key: { action: 1, timestamp: -1 }, description: 'Index for action and timestamp' },
          { name: 'details.status_1_timestamp_-1', key: { 'details.status': 1, timestamp: -1 }, description: 'Index for status and timestamp' },
        ],
      },
      EmailPreference: {
        model: EmailPreference,
        indexes: [
          { name: 'adminId_1', key: { adminId: 1 }, description: 'Unique index on adminId', unique: true },
          { name: 'email_1', key: { email: 1 }, description: 'Index on email' },
          { name: 'subscribed_1_frequency_1', key: { subscribed: 1, frequency: 1 }, description: 'Compound index for subscription status and frequency' },
          { name: 'lastEmailSent_1_subscribed_1', key: { lastEmailSent: 1, subscribed: 1 }, description: 'Index for last email sent and subscription status' },
        ],
      },
      EmailDeliveryLog: {
        model: EmailDeliveryLog,
        indexes: [
          { name: 'jobId_1_adminId_1_finalStatus_1', key: { jobId: 1, adminId: 1, finalStatus: 1 }, description: 'Compound index for job, admin, and status' },
          { name: 'adminId_1_createdAt_-1', key: { adminId: 1, createdAt: -1 }, description: 'Index for admin and creation date' },
          { name: 'finalStatus_1_createdAt_-1', key: { finalStatus: 1, createdAt: -1 }, description: 'Index for status and creation date' },
          { name: 'finalStatus_1_attempts.nextRetry_1', key: { finalStatus: 1, 'attempts.nextRetry': 1 }, description: 'Index for status and next retry' },
          { name: 'messageId_1', key: { messageId: 1 }, description: 'Index on message ID' },
        ],
      },
      Order: {
        model: Order,
        indexes: [
          { name: 'status_1_createdAt_-1', key: { status: 1, createdAt: -1 }, description: 'Index for status and creation date' },
          { name: 'seller_1_status_1_createdAt_-1', key: { seller: 1, status: 1, createdAt: -1 }, description: 'Compound index for seller, status, and creation date' },
          { name: 'status_1_items.product_1_createdAt_-1', key: { status: 1, 'items.product': 1, createdAt: -1 }, description: 'Compound index for status, product, and creation date' },
          { name: 'status_1_total_1_createdAt_-1', key: { status: 1, total: 1, createdAt: -1 }, description: 'Compound index for status, total, and creation date' },
        ],
      },
    };

    let allCorrect = true;
    let totalIndexes = 0;

    // Verify each collection
    for (const [collectionName, collectionData] of Object.entries(expectedIndexes)) {
      console.log(`\n📊 Verifying ${collectionName}:`);
      console.log('─'.repeat(80));

      const actualIndexes = await collectionData.model.collection.getIndexes();
      const actualIndexNames = Object.keys(actualIndexes);

      console.log(`Current indexes (${actualIndexNames.length}):`);
      actualIndexNames.forEach((name) => {
        const spec = actualIndexes[name];
        console.log(`  • ${name}: ${JSON.stringify(spec.key)}`);
      });

      console.log(`\nExpected indexes (${collectionData.indexes.length}):`);
      
      for (const expectedIndex of collectionData.indexes) {
        const found = actualIndexNames.some((name) => {
          const actual = actualIndexes[name];
          return JSON.stringify(actual.key) === JSON.stringify(expectedIndex.key);
        });

        if (found) {
          console.log(`  ✅ ${expectedIndex.description}`);
          console.log(`     Key: ${JSON.stringify(expectedIndex.key)}`);
          totalIndexes++;
        } else {
          console.log(`  ❌ MISSING: ${expectedIndex.description}`);
          console.log(`     Expected: ${JSON.stringify(expectedIndex.key)}`);
          allCorrect = false;
        }
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 Summary:\n');

    if (allCorrect) {
      console.log('✅ All indexes are correctly defined!');
      console.log(`\n📊 Total indexes verified: ${totalIndexes}`);
      console.log('\n✅ Index Strategy:');
      console.log('  • ReportSnapshot: TTL index for 2-year retention');
      console.log('  • ReportAuditLog: Indexes on adminId, action, timestamp for audit trail');
      console.log('  • EmailPreference: Unique index on adminId for preference lookup');
      console.log('  • EmailDeliveryLog: Indexes on jobId, adminId, status for delivery tracking');
      console.log('  • Order: Compound indexes for efficient report queries');
      console.log('\n✅ All indexes verified successfully!');
      return true;
    } else {
      console.log('❌ Index verification failed!');
      console.log('  Some required indexes are missing or incorrectly defined.');
      console.log('\n  Run: node scripts/create-report-indexes.js');
      return false;
    }

  } catch (error) {
    console.error('❌ Error verifying indexes:', error.message);
    console.error(error);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

// Run verification
if (require.main === module) {
  verifyReportIndexes()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = verifyReportIndexes;
