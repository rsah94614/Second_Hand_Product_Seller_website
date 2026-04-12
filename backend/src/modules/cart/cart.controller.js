const Cart = require('../../../models/Cart');
const Product = require('../../../models/Product');
const Order = require('../../../models/Order');
const {
  createNotification,
  createNotifications,
} = require('../../shared/utils/notification.utils');
const {
  normalizeQuantity,
  populateCart,
  formatCartResponse,
} = require('./cart.service');

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    await populateCart(cart);

    // Auto-clean any ghost products that have been deleted permanently from the db
    const ghostItems = cart.items.filter((item) => item.product == null);
    if (ghostItems.length > 0) {
      cart.items = cart.items.filter((item) => item.product != null);
      await cart.save();
    }

    return res.json(formatCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addToCart = async (req, res) => {
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
};

const updateCartItem = async (req, res) => {
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
};

const removeFromCart = async (req, res) => {
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
};

const checkout = async (req, res) => {
  try {
    const { shippingDetails = {} } = req.body;
    const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
    const missingFields = requiredFields.filter((field) => !shippingDetails[field]);

    if (missingFields.length) {
      return res.status(400).json({
        message: `Missing required shipping fields: ${missingFields.join(', ')}`,
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product'
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const unavailableProduct = cart.items.find(
      (item) => !item.product || item.product.isSold || item.product.isActive === false
    );

    if (unavailableProduct) {
      return res.status(400).json({
        message: 'One or more products in your cart are no longer available.',
      });
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
      shippingDetails: {
        fullName: shippingDetails.fullName || req.user.name || '',
        phone: shippingDetails.phone || req.user.phone || '',
        email: shippingDetails.email || req.user.email || '',
        addressLine1: shippingDetails.addressLine1 || '',
        addressLine2: shippingDetails.addressLine2 || '',
        landmark: shippingDetails.landmark || '',
        city: shippingDetails.city || '',
        state: shippingDetails.state || '',
        postalCode: shippingDetails.postalCode || '',
        country: shippingDetails.country || 'India',
      },
    });

    const uniqueSellerIds = [...new Set(
      cart.items
        .map((item) => item.product?.seller)
        .filter(Boolean)
        .map((sellerId) => sellerId.toString())
    )];

    await Promise.all([
      createNotification({
        userId: req.user._id,
        actorId: req.user._id,
        orderId: order._id,
        type: 'order_placed',
        title: 'Order placed successfully',
        message: `Your cart checkout order with ${orderItems.length} item${orderItems.length > 1 ? 's' : ''} is now processing.`,
        link: '/orders',
        metadata: {
          status: order.status,
          itemCount: orderItems.length,
        },
      }),
      createNotifications(uniqueSellerIds, {
        actorId: req.user._id,
        orderId: order._id,
        type: 'new_order',
        title: 'New order received',
        message: `${req.user.name} placed a checkout order containing your listing${uniqueSellerIds.length > 1 ? 's' : ''}.`,
        link: '/notifications',
        metadata: {
          buyerId: req.user._id.toString(),
          itemCount: orderItems.length,
        },
      }),
    ]);

    cart.items = [];
    await cart.save();

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  checkout,
};
