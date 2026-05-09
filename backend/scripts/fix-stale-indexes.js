const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is missing in backend/.env');
    process.exit(1);
  }
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const dropStaleIndexes = async () => {
  try {
    await connectDB();

    const collectionName = 'registrationotps';
    const collection = mongoose.connection.collection(collectionName);

    console.log(`Checking indexes for collection: ${collectionName}...`);
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    const phoneIndex = indexes.find(idx => idx.name === 'phone_1');

    if (phoneIndex) {
      console.log('Stale phone_1 index found. Dropping...');
      await collection.dropIndex('phone_1');
      console.log('Index phone_1 dropped successfully.');
    } else {
      console.log('No stale phone_1 index found.');
    }

    // Optional: Check User collection for similar stale indexes if needed
    // const userIndexes = await mongoose.connection.collection('users').indexes();
    // ...

    process.exit(0);
  } catch (error) {
    console.error('Maintenance failed:', error);
    process.exit(1);
  }
};

dropStaleIndexes();
