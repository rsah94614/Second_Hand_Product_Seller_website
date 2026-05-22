const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { runSellerPerformanceTests } = require('./ReportGeneratorService.SellerPerformance.pbt');

const run = async () => {
  await setupTestApp();

  try {
    await runSellerPerformanceTests();
    console.log('\n✓ All property-based tests passed!');
  } catch (error) {
    console.error('\n✗ Property-based tests failed!');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await teardownTestApp();
  }
};

run().catch((error) => {
  console.error('Test runner crashed');
  console.error(error);
  process.exitCode = 1;
});
