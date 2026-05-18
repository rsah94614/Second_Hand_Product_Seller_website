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
    const product = await Product.findOne({ isActive: true, isSold: false, stock: { $gte: 1 }, seller: { $ne: user._id } });

    console.log(`Using user: ${user.email}, product: ${product.title}`);

    // Update the recent order to 'delivered'
    const recentOrder = await Order.findOne({ user: user._id, 'items.product': product._id }).sort({ createdAt: -1 });
    if (recentOrder) {
      console.log('Found recent order:', recentOrder._id, 'Setting to delivered...');
      recentOrder.status = 'delivered';
      await recentOrder.save();
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, campus: user.campus },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const payload = { productId: product._id, quantity: 1 };
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Creating order again...');
    try {
      const res = await axios.post('https://second-hand-product-seller-website.onrender.com/api/orders', payload, { headers });
      console.log('Order Success:', res.data._id);
    } catch (e) {
      console.log('Order Failed:', e.response?.data || e.message);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}
test();
