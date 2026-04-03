const dotenv = require('dotenv');
const createApp = require('./app');
const connectDB = require('./config/db');
const connectCloudinary = require('./config/cloudinary');
const { ensureDefaultCategories } = require('../utils/categoryDefaults');

dotenv.config();

const { server } = createApp();

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultCategories();
    connectCloudinary();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
