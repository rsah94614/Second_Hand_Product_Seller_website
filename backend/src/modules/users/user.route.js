const express = require('express');
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const auth = require('../../shared/middleware/auth.middleware');

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const products = await Product.find({ seller: req.params.id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      user,
      recentProducts: products,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      avatar: req.body.avatar,
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true }
    ).select('-password');

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
