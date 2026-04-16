const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const { createNotification } = require('../../shared/utils/notification.utils');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatOrderId = (id) => id.toString().slice(-6).toUpperCase();

// ─── Create (Request) ─────────────────────────────────────────────────────────

const createOrder = async (req, res) => {
  try {
    const { productId, shippingDetails = {} } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findById(productId).populate('seller', '_id name email');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.isSold || !product.isActive || product.isExpired) {
      return res.status(400).json({ message: 'This item is no longer available' });
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
        quantity: 1,          // Always 1 for campus second-hand
      }],
      total: product.price,
      status: 'requested',
      shippingDetails: {
        fullName: shippingDetails.fullName || req.user.name || '',
        phone: shippingDetails.phone || req.user.phone || '',
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
      // Notify buyer
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
      // Notify seller
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

// ─── Accept ───────────────────────────────────────────────────────────────────

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

// ─── Schedule Meetup ──────────────────────────────────────────────────────────

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

// ─── Mark Completed ───────────────────────────────────────────────────────────

const markCompleted = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'title _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the buyer can confirm completion' });
    }
    if (!['accepted', 'meetup_scheduled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot complete an order with status "${order.status}"` });
    }

    order.status = 'completed';
    order.reviewUnlocked = true;
    await order.save();

    // Mark product as sold
    await Product.findByIdAndUpdate(order.items[0]?.product, { isSold: true, isActive: false });

    await Promise.all([
      createNotification({
        userId: order.seller,
        actorId: req.user._id,
        orderId: order._id,
        type: 'order_completed',
        title: 'Deal completed! 🎉',
        message: `${req.user.name} confirmed the deal for "${order.items[0]?.title}" is complete.`,
        link: '/orders',
        metadata: { status: 'completed' },
      }),
      createNotification({
        userId: order.user,
        actorId: req.user._id,
        orderId: order._id,
        type: 'review_unlocked',
        title: 'Leave a review',
        message: `Your deal is complete! You can now rate the seller.`,
        link: '/orders',
        metadata: { status: 'completed', reviewUnlocked: true },
      }),
    ]);

    return res.json({ message: 'Deal marked as completed. You can now review the seller.', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Mark No-Show ─────────────────────────────────────────────────────────────

const markNoShow = async (req, res) => {
  try {
    const { noShowBy, reason = '' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (order.status !== 'meetup_scheduled') {
      return res.status(400).json({ message: 'No-show can only be reported for scheduled meetup orders' });
    }
    if (!['buyer', 'seller'].includes(noShowBy)) {
      return res.status(400).json({ message: 'noShowBy must be "buyer" or "seller"' });
    }

    order.status = 'no_show';
    order.noShowBy = noShowBy;
    order.cancellationReason = reason.trim();
    await order.save();

    const notifyUserId = isBuyer ? order.seller : order.user;
    await createNotification({
      userId: notifyUserId,
      actorId: req.user._id,
      orderId: order._id,
      type: 'order_no_show',
      title: 'No-show reported',
      message: `A no-show was reported on order #${formatOrderId(order._id)}. This may be reviewed by moderators.`,
      link: '/orders',
      metadata: { noShowBy },
    });

    return res.json({ message: 'No-show reported', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Cancel ───────────────────────────────────────────────────────────────────

const cancelOrder = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const order = await Order.findById(req.params.id).populate('items.product', 'seller title');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    if (!['requested', 'accepted', 'meetup_scheduled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot cancel an order with status "${order.status}"` });
    }

    order.status = 'cancelled';
    order.cancelledBy = isBuyer ? 'buyer' : 'seller';
    order.cancellationReason = reason.trim();
    await order.save();

    const notifyUserId = isBuyer ? order.seller : order.user;
    if (notifyUserId) {
      await createNotification({
        userId: notifyUserId,
        actorId: req.user._id,
        orderId: order._id,
        type: 'order_cancelled',
        title: 'Order cancelled',
        message: `${req.user.name} cancelled order #${formatOrderId(order._id)}${reason.trim() ? `: ${reason.trim()}` : '.'} `,
        link: '/orders',
        metadata: { status: 'cancelled', cancelledBy: order.cancelledBy },
      });
    }

    return res.json({ message: 'Order cancelled', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

const getOrders = async (req, res) => {
  try {
    const { role = 'buyer' } = req.query;
    const query = role === 'seller'
      ? { seller: req.user._id }
      : { user: req.user._id };

    const orders = await Order.find(query)
      .populate('items.product', 'title images price category')
      .populate('user', 'name phone avatar')
      .populate('seller', 'name phone avatar')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title images price category condition')
      .populate('user', 'name phone avatar')
      .populate('seller', 'name phone avatar');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user?._id?.toString() === req.user._id.toString();
    const isSeller = order.seller?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  acceptOrder,
  scheduleMeetup,
  markCompleted,
  markNoShow,
  cancelOrder,
  getOrders,
  getOrderById,
};
