const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

const normalizeQuantity = (quantity = 1) => {
  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty < 1) {
    return 1;
  }
  return Math.floor(qty);
};

const populateCart = async (cart) => {
  if (!cart) return null;
  return cart.populate('items.product');
};

const formatCartResponse = (cart) => {
  if (!cart) {
    return {
      items: [],
      summary: { itemCount: 0, totalAmount: 0 },
    };
  }

  const items = cart.items.map((item) => {
    const product =
      item.product && typeof item.product.toObject === 'function'
        ? item.product.toObject()
        : item.product;
    const price = product?.price || 0;

    return {
      _id: item._id,
      quantity: item.quantity,
      product,
      subtotal: price * item.quantity,
    };
  });

  const summary = items.reduce(
    (acc, item) => {
      acc.itemCount += item.quantity;
      acc.totalAmount += item.subtotal;
      return acc;
    },
    { itemCount: 0, totalAmount: 0 }
  );

  return { items, summary };
};

// Get current user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    await populateCart(cart);
    return res.json(formatCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Add product to cart
router.post('/', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const normalizedQty = normalizeQuantity(quantity);

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += normalizedQty;
    } else {
      cart.items.push({ product: productId, quantity: normalizedQty });
    }

    await cart.save();
    await populateCart(cart);

    return res.status(existingItem ? 200 : 201).json(formatCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Update item quantity
router.put('/:productId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    const normalizedQty = normalizeQuantity(quantity);
    if (Number(quantity) < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.find(
      (cartItem) => cartItem.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = normalizedQty;
    await cart.save();
    await populateCart(cart);

    return res.json(formatCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Remove item from cart
router.delete('/:productId', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await cart.save();
    await populateCart(cart);

    return res.json(formatCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Checkout current cart
router.post('/checkout', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product'
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      title: item.product.title,
      image: item.product.images?.[0] || '',
      price: item.product.price,
      quantity: item.quantity,
    }));

    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
    });

    cart.items = [];
    await cart.save();

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

