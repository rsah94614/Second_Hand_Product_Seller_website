const dotenv = require('dotenv');
const createApp = require('./app');
const connectDB = require('./config/db');
const connectCloudinary = require('./config/cloudinary');
const { validateEnvironment } = require('./config/env');
const { verifyTransporter } = require('./shared/utils/emailService');
const { ensureDefaultCategories } = require('../utils/categoryDefaults');
const { startReminderService } = require('./services/reminder.service');
const emailSchedulerService = require('./services/EmailSchedulerService');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
validateEnvironment();

const logger = require('./services/logger.service');
const { app, server, io } = createApp();

// Expose io to HTTP route handlers via req.app.get('io')
app.set('io', io);

// Catch unhandled errors so the process doesn't silently die in production
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason instanceof Error ? reason.message : reason });
});

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultCategories();
    connectCloudinary();

    // Verify email service (non-blocking)
    verifyTransporter();

    // Start reminder service (Task 2.3.1)
    startReminderService();

    // Start email scheduler service (Phase 3.3)
    emailSchedulerService.start();

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
