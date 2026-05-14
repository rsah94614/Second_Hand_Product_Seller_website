/**
 * Verify Message Schema Indexes
 * 
 * This script verifies that all required indexes are properly defined
 * on the Message schema and provides diagnostic information.
 * 
 * Usage: node scripts/verify-indexes.js
 */

const Message = require('../models/Message');

async function verifyIndexes() {
  try {
    console.log('🔍 Verifying Message Schema Indexes...\n');

    // Get all indexes
    const indexes = await Message.collection.getIndexes();
    
    console.log('📊 Current Indexes:');
    console.log('─'.repeat(80));
    
    Object.entries(indexes).forEach(([name, spec], index) => {
      console.log(`\n${index}. Index: "${name}"`);
      console.log(`   Key: ${JSON.stringify(spec.key)}`);
      if (spec.partialFilterExpression) {
        console.log(`   Partial Filter: ${JSON.stringify(spec.partialFilterExpression)}`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n✅ Index Verification Results:\n');

    // Check for required indexes
    const requiredIndexes = {
      'delivered_1': {
        name: 'delivered',
        key: { delivered: 1 },
        description: 'Single field index on delivered'
      },
      'read_1': {
        name: 'read',
        key: { read: 1 },
        description: 'Single field index on read'
      },
      'sender_1_receiver_1_timestamp_-1': {
        name: 'compound',
        key: { sender: 1, receiver: 1, timestamp: -1 },
        description: 'Compound index for conversation history'
      },
      'receiver_1_read_1': {
        name: 'partial',
        key: { receiver: 1, read: 1 },
        description: 'Partial index for unread messages',
        partialFilterExpression: { read: false }
      }
    };

    let allPresent = true;
    let allCorrect = true;

    Object.entries(requiredIndexes).forEach(([indexName, expected]) => {
      const exists = indexName in indexes;
      const actual = indexes[indexName];

      if (!exists) {
        console.log(`❌ MISSING: ${expected.description}`);
        console.log(`   Expected index: "${indexName}"`);
        allPresent = false;
        return;
      }

      // Verify index structure
      const keyMatch = JSON.stringify(actual.key) === JSON.stringify(expected.key);
      const partialMatch = !expected.partialFilterExpression || 
        JSON.stringify(actual.partialFilterExpression) === JSON.stringify(expected.partialFilterExpression);

      if (keyMatch && partialMatch) {
        console.log(`✅ CORRECT: ${expected.description}`);
        console.log(`   Index: "${indexName}"`);
        console.log(`   Key: ${JSON.stringify(actual.key)}`);
        if (actual.partialFilterExpression) {
          console.log(`   Partial Filter: ${JSON.stringify(actual.partialFilterExpression)}`);
        }
      } else {
        console.log(`⚠️  INCORRECT: ${expected.description}`);
        console.log(`   Expected: ${JSON.stringify(expected.key)}`);
        console.log(`   Actual: ${JSON.stringify(actual.key)}`);
        allCorrect = false;
      }
    });

    // Check for duplicate indexes
    console.log('\n' + '─'.repeat(80));
    console.log('\n🔎 Checking for Duplicate Indexes:\n');

    const indexKeys = Object.values(indexes).map(idx => JSON.stringify(idx.key));
    const duplicates = indexKeys.filter((key, index) => indexKeys.indexOf(key) !== index);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate indexes found');
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate index(es):`);
      duplicates.forEach(dup => console.log(`   - ${dup}`));
      allCorrect = false;
    }

    // Summary
    console.log('\n' + '─'.repeat(80));
    console.log('\n📋 Summary:\n');

    if (allPresent && allCorrect) {
      console.log('✅ All indexes are correctly defined!');
      console.log('\nIndex Strategy:');
      console.log('  • delivered: Single field index for delivery status queries');
      console.log('  • read: Single field index for read status queries');
      console.log('  • (sender, receiver, timestamp): Compound index for conversation history');
      console.log('  • (receiver, read): Partial index for unread message queries');
      console.log('\nNo errors found in schema.');
      return true;
    } else {
      console.log('❌ Index verification failed!');
      if (!allPresent) console.log('  - Some required indexes are missing');
      if (!allCorrect) console.log('  - Some indexes are incorrectly defined');
      return false;
    }

  } catch (error) {
    console.error('❌ Error verifying indexes:', error.message);
    return false;
  }
}

// Run verification
if (require.main === module) {
  verifyIndexes()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = verifyIndexes;
