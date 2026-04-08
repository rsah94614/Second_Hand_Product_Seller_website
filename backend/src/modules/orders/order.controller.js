const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const {
  createNotification,
  createNotifications,
} = require('../../shared/utils/notification.utils');

const normalizeQuantity = (quantity = 1) => {
  const parsed = Number(quantity);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
};

const createOrder = async (req, res) => {
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
      return res.status(400).json({ message: 'Product is no longer available for ordering' });
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

    await Promise.all([
      createNotification({
        userId: req.user._id,
        actorId: req.user._id,
        productId: product._id,
        orderId: order._id,
        type: 'order_placed',
        title: 'Order placed successfully',
        message: `Your order for "${product.title}" has been placed.`,
        link: '/orders',
        metadata: {
          status: order.status,
          productTitle: product.title,
        },
      }),
      createNotifications([product.seller], {
        actorId: req.user._id,
        productId: product._id,
        orderId: order._id,
        type: 'new_order',
        title: 'New order received',
        message: `${req.user.name} placed an order for "${product.title}".`,
        link: '/notifications',
        metadata: {
          buyerId: req.user._id.toString(),
          productTitle: product.title,
        },
      }),
    ]);

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
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
};

const cancelOrder = async (req, res) => {
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
        message: 'Only processing orders can be cancelled',
      });
    }

    order.status = 'cancelled';
    await order.save();

    const sellerIds = [...new Set(
      (order.items || [])
        .map((item) => item.product)
        .filter(Boolean)
        .map((productId) => productId.toString())
    )];

    if (sellerIds.length) {
      const sellerProducts = await Product.find({
        _id: { $in: sellerIds },
      }).select('seller');

      await createNotifications(
        sellerProducts.map((product) => product.seller),
        {
          actorId: req.user._id,
          orderId: order._id,
          type: 'order_cancelled',
          title: 'Order cancelled',
          message: `${req.user.name} cancelled order #${order._id.toString().slice(-6).toUpperCase()}.`,
          link: '/notifications',
          metadata: {
            status: order.status,
          },
        }
      );
    }

    return res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
};
