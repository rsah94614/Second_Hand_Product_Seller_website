const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

const normalizeQuantity = (quantity = 1) => {
  const parsed = Number(quantity);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
};

// Create a direct order for a single product
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, shippingDetails = {} } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
    const missingFields = requiredFields.filter((field) => !shippingDetails[field]);

    if (missingFields.length) {
      return res.status(400).json({
        message: `Missing required shipping fields: ${missingFields.join(', ')}`,
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.isSold || product.isActive === false) {
      return res
        .status(400)
        .json({ message: 'Product is no longer available for ordering' });
    }

    const normalizedQty = normalizeQuantity(quantity);
    const total = product.price * normalizedQty;

    const order = await Order.create({
      user: req.user._id,
      items: [
        {
          product: product._id,
          title: product.title,
          image: product.images?.[0] || '',
          price: product.price,
          quantity: normalizedQty,
        },
      ],
      total,
      shippingDetails: {
        ...shippingDetails,
        country: shippingDetails.country || 'India',
      },
    });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get current user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'processing') {
      return res.status(400).json({
        message: 'Only processing orders can be cancelled'
      });
    }

    order.status = 'cancelled';
    await order.save();

    return res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;


