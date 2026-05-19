const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Order = require('../models/Order');

    const user = await User.findOne({ isActive: true });
    if (!user) return console.log('No user');

    const product = await Product.findOne({ isActive: true, isSold: false, stock: { $gte: 1 }, seller: { $ne: user._id } });
    if (!product) return console.log('No product');

    console.log(`Using user: ${user.email}, product: ${product.title}`);

    const token = jwt.sign(
      { userId: user._id, role: user.role, campus: user.campus },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const payload = { productId: product._id, quantity: 1 };
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Creating order 1...');
    try {
      const res1 = await axios.post('https://second-hand-product-seller-website.onrender.com/api/orders', payload, { headers });
      console.log('Order 1 Success:', res1.data._id);
    } catch (e) {
      console.log('Order 1 Failed:', e.response?.data || e.message);
    }

    console.log('Creating order 2 (duplicate)...');
    try {
      const res2 = await axios.post('https://second-hand-product-seller-website.onrender.com/api/orders', payload, { headers });
      console.log('Order 2 Success:', res2.data._id);
    } catch (e) {
      console.log('Order 2 Failed:', e.response?.data || e.message);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}
test();
