const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { runAdminTests } = require('./admin.test');
const { runAuthTests } = require('./auth.test');
const { runCartTests } = require('./cart.test');
const { runCategoryTests } = require('./categories.test');
const { runNotificationTests } = require('./notifications.test');
const { runOrderTests } = require('./orders.test');
const { runProductFeatureTests } = require('./products.test');
const { runUserFeatureTests } = require('./users.test');

const tests = [
  ['Auth API', runAuthTests],
  ['User Features API', runUserFeatureTests],
  ['Product Features API', runProductFeatureTests],
  ['Orders API', runOrderTests],
  ['Cart API', runCartTests],
  ['Admin API', runAdminTests],
  ['Categories API', runCategoryTests],
  ['Notifications API', runNotificationTests],
];

const run = async () => {
  const appBundle = await setupTestApp();
  const app = appBundle.app;
  const results = [];

  try {
    for (const [label, execute] of tests) {
      try {
        await execute(app);
        results.push({ label, status: 'passed' });
        console.log(`PASS ${label}`);
      } catch (error) {
        results.push({ label, status: 'failed', error });
        console.error(`FAIL ${label}`);
        console.error(error);
      }
    }
  } finally {
    await teardownTestApp();
  }

  const failed = results.filter((result) => result.status === 'failed');

  console.log('\nTest summary');
  results.forEach((result) => {
    console.log(`- ${result.label}: ${result.status}`);
  });

  if (failed.length) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Test runner crashed');
  console.error(error);
  process.exitCode = 1;
});
