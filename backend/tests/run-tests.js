const { setupTestApp, teardownTestApp } = require('./helpers/testApp');
const { runAuthTests } = require('./auth.test');
const { runNotificationTests } = require('./notifications.test');

const tests = [
  ['Auth API', runAuthTests],
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
