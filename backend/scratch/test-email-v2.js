const { verifyTransporter } = require('../src/shared/utils/emailService');
const dotenv = require('dotenv');
const path = require('path');

// Load env explicitly for the test script
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const runDiagnostic = async () => {
  console.log('--- Email Service Diagnostic ---');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  await verifyTransporter();
  console.log('--- Diagnostic Complete ---');
  process.exit(0);
};

runDiagnostic();
