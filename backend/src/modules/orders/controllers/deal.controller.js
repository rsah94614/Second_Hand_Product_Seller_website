const Order = require('../../../../models/Order');
const Product = require('../../../../models/Product');
const { createNotification } = require('../../../shared/utils/notification.utils');

const createOrder = async (req, res) => {
  try {
    const { productId, quantity = 1, shippingDetails = {} } = req.body;
    const { normalizeQuantity } = require('../../cart/cart.service');
    const normalizedQty = normalizeQuantity(quantity);

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findById(productId).populate('seller', '_id name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < normalizedQty || product.isSold || !product.isActive || product.isExpired) {
      return res.status(400).json({ message: product.stock < normalizedQty ? `Insufficient stock. Only ${product.stock} available.` : 'This item is no longer available' });
    }
    if (product.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot order your own listing' });
    }

    // Prevent duplicate active orders for same product by same buyer
    const duplicate = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      status: { $in: ['requested', 'accepted', 'meetup_scheduled'] },
    });
    if (duplicate) {
      return res.status(400).json({
        message: 'You already have an active request for this item.',
        orderId: duplicate._id,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      seller: product.seller._id,
      items: [{
        product: product._id,
        title: product.title,
        image: product.images?.[0] || '',
        price: product.price,
        quantity: normalizedQty,
      }],
      total: product.price * normalizedQty,
      status: 'requested',
      shippingDetails: {
        fullName: shippingDetails.fullName || req.user.name || '',
        email: shippingDetails.email || req.user.email || '',
        addressLine1: shippingDetails.addressLine1 || '',
        landmark: shippingDetails.landmark || '',
        city: shippingDetails.city || '',
        state: shippingDetails.state || '',
        postalCode: shippingDetails.postalCode || '',
        country: 'India',
      },
    });

    await Promise.all([
      createNotification({
        userId: req.user._id,
        actorId: req.user._id,
        productId: product._id,
        orderId: order._id,
        type: 'order_placed',
        title: 'Deal request sent!',
        message: `Your request for "${product.title}" has been sent to the seller. Await their acceptance.`,
        link: '/orders',
        metadata: { status: 'requested', productTitle: product.title },
      }),
      createNotification({
        userId: product.seller._id,
        actorId: req.user._id,
        productId: product._id,
        orderId: order._id,
        type: 'new_order',
        title: 'New deal request!',
        message: `${req.user.name} wants to buy "${product.title}". Accept or decline.`,
        link: '/orders',
        metadata: { buyerId: req.user._id.toString(), productTitle: product.title },
      }),
    ]);

    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'title seller');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the seller can accept this order' });
    }
    if (order.status !== 'requested') {
      return res.status(400).json({ message: `Order is already ${order.status}` });
    }

    order.status = 'accepted';
    await order.save();

    await createNotification({
      userId: order.user,
      actorId: req.user._id,
      orderId: order._id,
      type: 'order_accepted',
      title: 'Deal accepted! ✅',
      message: `The seller accepted your request for "${order.items[0]?.title}". Coordinate a campus meetup.`,
      link: '/orders',
      metadata: { status: 'accepted' },
    });

    return res.json({ message: 'Order accepted', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const scheduleMeetup = async (req, res) => {
  try {
    const { location, scheduledAt, notes = '' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!['accepted', 'meetup_scheduled'].includes(order.status)) {
      return res.status(400).json({ message: 'Order must be accepted before scheduling meetup' });
    }
    if (!location) {
      return res.status(400).json({ message: 'Meetup location is required' });
    }

    order.status = 'meetup_scheduled';
    order.meetupDetails = {
      location,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      notes: notes.trim(),
    };
    await order.save();

    const notifyUserId = isBuyer ? order.seller : order.user;
    await createNotification({
      userId: notifyUserId,
      actorId: req.user._id,
      orderId: order._id,
      type: 'meetup_scheduled',
      title: 'Meetup scheduled 📍',
      message: `Meetup at "${location}"${scheduledAt ? ` on ${new Date(scheduledAt).toLocaleDateString('en-IN')}` : ''}.`,
      link: '/orders',
      metadata: { location, scheduledAt },
    });

    return res.json({ message: 'Meetup scheduled', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  acceptOrder,
  scheduleMeetup,
};
