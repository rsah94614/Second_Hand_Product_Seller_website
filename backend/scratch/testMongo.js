const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const User = require('../models/User');
    const user = await User.findOne({ isActive: true });
    
    if (!user) {
      console.log('No active user found');
      process.exit(1);
    }
    
    console.log('Found user:', user.email);
    
    const token = jwt.sign(
      { userId: user._id, role: user.role, campus: user.campus },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('Generated token');
    
    const res = await axios.get('https://second-hand-product-seller-website.onrender.com/api/chat/conversations/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Conversations:', res.data.length);
    console.log('Data:', JSON.stringify(res.data, null, 2).slice(0, 500));
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  } finally {
    mongoose.disconnect();
  }
}

test();
