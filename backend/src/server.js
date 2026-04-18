const dotenv = require('dotenv');
const createApp = require('./app');
const connectDB = require('./config/db');
const connectCloudinary = require('./config/cloudinary');
const { validateEnvironment } = require('./config/env');
const { ensureDefaultCategories } = require('../utils/categoryDefaults');
const { startReminderService } = require('./services/reminder.service');

dotenv.config();
validateEnvironment();

const logger = require('./services/logger.service');
const { server } = createApp();

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultCategories();
    connectCloudinary();

    // Start reminder service (Task 2.3.1)
    startReminderService();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV || 'development' });
    });
  } catch (error) {
    logger.error('Failed to start server', { message: error.message });
    process.exit(1);
  }
};

startServer();
