const mongoose = require('mongoose');

const buildConnectionErrorMessage = (error) => {
  const lines = [
    'MongoDB connection failed.',
    `Reason: ${error.message}`,
  ];

  if (
    error.code === 'ECONNREFUSED' &&
    typeof error.hostname === 'string' &&
    error.hostname.includes('_mongodb._tcp.')
  ) {
    lines.push(
      'The current MONGODB_URI uses mongodb+srv, which depends on DNS SRV lookup.',
      'Your machine or network is refusing that DNS lookup.',
      'Use one of these fixes:',
      '1. Switch to a normal mongodb:// connection string from MongoDB Atlas instead of mongodb+srv://',
      '2. Try another network / DNS resolver',
      '3. Run a local MongoDB instance and point MONGODB_URI to mongodb://127.0.0.1:27017/<db-name>'
    );
  }

  return lines.join('\n');
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in backend/.env');
  }

  if (mongoose.connection.listeners('connected').length === 0) {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connection successful');
  } catch (error) {
    throw new Error(buildConnectionErrorMessage(error));
  }
};

const connectWithRetry = async () => {
  try {
    await mongoose.connect(mongoUri);
  } catch (err) {
    console.log('Retrying DB connection in 5 sec...');
    setTimeout(connectWithRetry, 5000);
  }
};

module.exports = connectDB;
