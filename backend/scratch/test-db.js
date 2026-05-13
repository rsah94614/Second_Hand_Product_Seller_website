const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const testDB = async () => {
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'FOUND' : 'MISSING');
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing');
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    const start = Date.now();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB in ${Date.now() - start}ms`);
    
    // Try a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
};

testDB();
