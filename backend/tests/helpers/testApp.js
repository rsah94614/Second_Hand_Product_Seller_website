const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../../src/app');
const { ensureDefaultCategories } = require('../../utils/categoryDefaults');

let mongoServer;
let appInstance;

const defaultEnv = {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret',
  CLIENT_URL: 'http://localhost:5173',
  DISABLE_RATE_LIMIT: 'true',
};

const applyTestEnv = () => {
  Object.entries(defaultEnv).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

const setupTestApp = async () => {
  applyTestEnv();

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  await mongoose.connect(process.env.MONGODB_URI);
  await ensureDefaultCategories();

  appInstance = createApp();
  appInstance.app.server = appInstance.server;
  appInstance.app.io = appInstance.io;
  return appInstance;
};

const teardownTestApp = async () => {
  if (appInstance?.server) {
    await new Promise((resolve, reject) => {
      appInstance.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    }).catch(() => {});
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

  appInstance = null;
  mongoServer = null;
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
  await ensureDefaultCategories();
};

module.exports = {
  setupTestApp,
  teardownTestApp,
  clearDatabase,
};
