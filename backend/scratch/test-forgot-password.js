const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const { forgotPassword } = require('../src/modules/auth/controllers/password.controller');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mockRes = {
  status: function(s) { this.statusCode = s; return this; },
  json: function(j) { 
    this.body = j; 
    console.log('Response sent:', JSON.stringify(j));
    console.timeEnd('forgotPassword');
    process.exit(0);
  }
};

const mockReq = {
  body: { email: 'rohitsah5645@gmail.com' }
};

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB Connected');
  
  // Ensure user exists
  await User.findOneAndUpdate(
    { email: 'rohitsah5645@gmail.com' },
    { name: 'Test User', password: 'password123' },
    { upsert: true }
  );

  console.time('forgotPassword');
  console.log('Calling forgotPassword...');
  await forgotPassword(mockReq, mockRes);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
