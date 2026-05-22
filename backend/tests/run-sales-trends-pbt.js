const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { runSalesTrendsPBTTests } = require('./ReportGeneratorService.SalesTrends.pbt');


const run = async () => {
  await setupTestApp();

  try {
    await runSalesTrendsPBTTests();
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
