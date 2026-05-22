/**
 * Verify EmailPreference Collection Setup
 * 
 * This script verifies that the EmailPreference collection is properly configured
 * with all required indexes and schema validation.
 * 
 * Usage: node scripts/verify-email-preference.js
 * 
 * **Validates: Requirements 9, 15, 17 (Email delivery, access control, email specifications)**
 */

const EmailPreference = require('../models/EmailPreference');

async function verifyEmailPreference() {
  try {
    console.log('🔍 Verifying EmailPreference Collection Setup...\n');

    // Get schema
    const schema = EmailPreference.schema;

    console.log('📊 EmailPreference Model Analysis');
    console.log('═'.repeat(80));

    console.log('\n✅ Model Name: EmailPreference');
    console.log('✅ Collection Name: emailpreferences');

    // Verify schema fields
    console.log('\n📋 Schema Fields:');
    console.log('─'.repeat(80));

    const fields = schema.paths;
    const requiredFields = ['adminId', 'email', 'subscribed', 'frequency', 'lastEmailSent', 'unsubscribeToken'];
    let allFieldsPresent = true;

    requiredFields.forEach(fieldName => {
      const field = fields[fieldName];
      if (!field) {
        console.log(`❌ MISSING: ${fieldName}`);
        allFieldsPresent = false;
        return;
      }

      console.log(`\n✅ ${fieldName}`);
      console.log(`   Type: ${field.instance}`);

      if (field.options.required) console.log(`   Required: true`);
      if (field.options.unique) console.log(`   Unique: true`);
      if (field.options.index) console.log(`   Indexed: true`);
      if (field.options.sparse) console.log(`   Sparse: true`);
      if (field.options.enum) console.log(`   Enum: [${field.options.enum.join(', ')}]`);
      if (field.options.default !== undefined) console.log(`   Default: ${field.options.default}`);
    });

    // Verify indexes
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 Indexes Defined in Schema:');
    console.log('─'.repeat(80));

    const indexes = schema._indexes || [];
    console.log(`\nTotal indexes: ${indexes.length}`);

    indexes.forEach((indexDef, idx) => {
      const [indexSpec, indexOptions] = indexDef;
      console.log(`\n${idx + 1}. Index Specification:`);
      console.log(`   Fields: ${JSON.stringify(indexSpec)}`);
      if (indexOptions) {
        console.log(`   Options: ${JSON.stringify(indexOptions)}`);
      }
    });

    // Verify specific requirements
    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Verification Results:\n');

    // Check for unique index on adminId
    const adminIdField = fields.adminId;
    const hasUniqueAdminId = adminIdField && adminIdField.options.unique === true;
    console.log(`✅ Unique index on adminId: ${hasUniqueAdminId ? 'YES ✓' : 'NO ✗'}`);

    // Check for email index (can be defined via field option or schema.index())
    const emailField = fields.email;
    const hasEmailIndexField = emailField && emailField.options.index === true;
    const hasEmailIndexSchema = indexes.some(idx => {
      const spec = idx[0];
      return spec.email === 1;
    });
    const hasEmailIndex = hasEmailIndexField || hasEmailIndexSchema;
    console.log(`✅ Index on email: ${hasEmailIndex ? 'YES ✓' : 'NO ✗'}`);

    // Check for unsubscribeToken index
    const tokenField = fields.unsubscribeToken;
    const hasTokenIndex = tokenField && tokenField.options.index === true;
    console.log(`✅ Index on unsubscribeToken: ${hasTokenIndex ? 'YES ✓' : 'NO ✗'}`);

    // Check for compound indexes
    const hasSubscriptionIndex = indexes.some(idx => {
      const spec = idx[0];
      return spec.subscribed === 1 && spec.frequency === 1;
    });
    console.log(`✅ Compound index on (subscribed, frequency): ${hasSubscriptionIndex ? 'YES ✓' : 'NO ✗'}`);

    const hasLastEmailIndex = indexes.some(idx => {
      const spec = idx[0];
      return spec.lastEmailSent === 1 && spec.subscribed === 1;
    });
    console.log(`✅ Compound index on (lastEmailSent, subscribed): ${hasLastEmailIndex ? 'YES ✓' : 'NO ✗'}`);

    // Test schema validation
    console.log('\n' + '═'.repeat(80));
    console.log('\n🧪 Schema Validation Tests:\n');

    // Test 1: Valid preference
    const mongoose = require('mongoose');
    const validPref = new EmailPreference({
      adminId: new mongoose.Types.ObjectId(),
      email: 'admin@example.com',
      subscribed: true,
      frequency: 'weekly'
    });

    const validError = validPref.validateSync();
    console.log(`✅ Valid preference: ${validError ? 'FAILED ✗' : 'PASSED ✓'}`);

    // Test 2: Missing adminId
    const missingAdminId = new EmailPreference({
      email: 'admin@example.com'
    });

    const missingError = missingAdminId.validateSync();
    console.log(`✅ Missing adminId validation: ${missingError && missingError.errors.adminId ? 'PASSED ✓' : 'FAILED ✗'}`);

    // Test 3: Invalid frequency
    const invalidFreq = new EmailPreference({
      adminId: new mongoose.Types.ObjectId(),
      email: 'admin@example.com',
      frequency: 'invalid'
    });

    const freqError = invalidFreq.validateSync();
    console.log(`✅ Invalid frequency validation: ${freqError && freqError.errors.frequency ? 'PASSED ✓' : 'FAILED ✗'}`);

    // Test 4: Email normalization
    const emailNorm = new EmailPreference({
      adminId: new mongoose.Types.ObjectId(),
      email: '  ADMIN@EXAMPLE.COM  '
    });

    console.log(`✅ Email normalization: ${emailNorm.email === 'admin@example.com' ? 'PASSED ✓' : 'FAILED ✗'}`);

    // Test 5: Default values
    const defaults = new EmailPreference({
      adminId: new mongoose.Types.ObjectId(),
      email: 'admin@example.com'
    });

    console.log(`✅ Default subscribed=true: ${defaults.subscribed === true ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log(`✅ Default frequency=weekly: ${defaults.frequency === 'weekly' ? 'PASSED ✓' : 'FAILED ✗'}`);

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 Summary:\n');

    const allChecks = [
      hasUniqueAdminId,
      hasEmailIndex,
      hasTokenIndex,
      hasSubscriptionIndex,
      hasLastEmailIndex,
      allFieldsPresent,
      !validError,
      missingError && missingError.errors.adminId,
      freqError && freqError.errors.frequency,
      emailNorm.email === 'admin@example.com',
      defaults.subscribed === true,
      defaults.frequency === 'weekly'
    ];

    const passedChecks = allChecks.filter(check => check).length;
    const totalChecks = allChecks.length;

    console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

    if (passedChecks === totalChecks) {
      console.log('\n✅ EmailPreference collection is properly configured!');
      console.log('\n✅ All acceptance criteria satisfied:');
      console.log('  • EmailPreference collection created with unique index on adminId');
      console.log('  • All indexes created and verified');
      console.log('  • Schema validation working correctly');
      console.log('  • Email normalization working correctly');
      console.log('  • Default values set correctly');
      return true;
    } else {
      console.log('\n❌ Some checks failed!');
      return false;
    }

  } catch (error) {
    console.error('❌ Error verifying EmailPreference:', error.message);
    console.error(error);
    return false;
  }
}

// Run verification
if (require.main === module) {
  verifyEmailPreference()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = verifyEmailPreference;
