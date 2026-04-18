const Order = require('../../../models/Order');
const Product = require('../../../models/Product');
const Dispute = require('../../../models/Dispute');
const User = require('../../../models/User');
const { createNotification } = require('../../shared/utils/notification.utils');
const cloudinary = require('cloudinary').v2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatOrderId = (id) => id.toString().slice(-6).toUpperCase();

// ─── Create (Request) ─────────────────────────────────────────────────────────

const createOrder = async (req, res) => {
  try {
    const { productId, quantity = 1, shippingDetails = {} } = req.body;
    const { normalizeQuantity } = require('../cart/cart.service');
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

    // Mark product as sold or decrement stock
    const stockUpdates = order.items.map(async (item) => {
      const p = await Product.findById(item.product);
      if (p) {
        const newStock = Math.max(0, p.stock - item.quantity);
        p.stock = newStock;
        if (newStock === 0) {
          p.isSold = true;
          p.isActive = false;
        }
        await p.save();
      }
    });
    await Promise.all(stockUpdates);

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

// ─── Upload Confirmation Photo (Task 2.3.2) ──────────────────────────────────

const uploadConfirmationPhoto = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!['meetup_scheduled', 'completed'].includes(order.status)) {
      return res.status(400).json({ message: 'Confirmation photo can only be uploaded for scheduled or completed orders' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a photo' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'campusmitra/order-confirmations',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
      ],
    });

    // Update order with confirmation photo
    order.confirmationPhoto = {
      url: result.secure_url,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };
    await order.save();

    // Notify the other party
    const notifyUserId = isBuyer ? order.seller : order.user;
    await createNotification({
      userId: notifyUserId,
      actorId: req.user._id,
      orderId: order._id,
      type: 'order_photo_uploaded',
      title: 'Confirmation photo uploaded 📸',
      message: `${req.user.name} uploaded a confirmation photo for order #${formatOrderId(order._id)}.`,
      link: `/orders/${order._id}`,
      metadata: { photoUrl: result.secure_url },
    });

    return res.json({
      message: 'Confirmation photo uploaded successfully',
      order,
      photoUrl: result.secure_url,
    });
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
      .populate('user', 'name avatar')
      .populate('seller', 'name location')
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
      .populate('user', 'name avatar')
      .populate('seller', 'name location');

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

// ─── Dispute System (Task 2.3.3) ─────────────────────────────────────────────

const createDispute = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const order = await Order.findById(req.params.id).populate('user seller', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user._id.toString() === req.user._id.toString();
    const isSeller = order.seller?._id?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if order is eligible for dispute
    if (!['completed', 'no_show'].includes(order.status)) {
      return res.status(400).json({ message: 'Disputes can only be filed for completed or no-show orders' });
    }

    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({
      order: order._id,
      status: { $in: ['open', 'under_review'] },
    });
    if (existingDispute) {
      return res.status(400).json({ message: 'An active dispute already exists for this order' });
    }

    // Validate reason
    if (!['damaged', 'not_received', 'not_as_described', 'other'].includes(reason)) {
      return res.status(400).json({ message: 'Invalid dispute reason' });
    }

    if (!description?.trim()) {
      return res.status(400).json({ message: 'Please provide a description' });
    }

    // Upload evidence photos if provided
    const evidenceUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'campusmitra/dispute-evidence',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        });
        evidenceUrls.push(result.secure_url);
      }
    }

    // Create dispute
    const dispute = await Dispute.create({
      order: order._id,
      initiatedBy: req.user._id,
      reason,
      description: description.trim(),
      evidence: evidenceUrls,
      status: 'open',
    });

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    if (admins.length > 0) {
      await Promise.all(
        admins.map((admin) =>
          createNotification({
            userId: admin._id,
            actorId: req.user._id,
            orderId: order._id,
            type: 'new_dispute',
            title: 'New dispute filed',
            message: `${req.user.name} filed a dispute for order #${formatOrderId(order._id)}. Reason: ${reason}`,
            link: '/admin/disputes',
            metadata: { disputeId: dispute._id.toString(), reason },
          })
        )
      );
    }

    // Notify the other party
    const notifyUserId = isBuyer ? order.seller._id : order.user._id;
    await createNotification({
      userId: notifyUserId,
      actorId: req.user._id,
      orderId: order._id,
      type: 'dispute_filed',
      title: 'Dispute filed',
      message: `A dispute was filed for order #${formatOrderId(order._id)}. Our team will review it.`,
      link: `/orders/${order._id}`,
      metadata: { disputeId: dispute._id.toString(), reason },
    });

    return res.status(201).json({
      message: 'Dispute filed successfully. Our team will review it.',
      dispute,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDisputes = async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status } = req.query;
    const query = {};
    if (status && ['open', 'under_review', 'resolved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const disputes = await Dispute.find(query)
      .populate('order', 'items total status')
      .populate('initiatedBy', 'name email')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });

    return res.json(disputes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.disputeId)
      .populate('order')
      .populate('initiatedBy', 'name email')
      .populate('resolvedBy', 'name');

    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    // Check authorization
    const order = await Order.findById(dispute.order._id);
    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    return res.json(dispute);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { resolution, adminNotes = '' } = req.body;
    const dispute = await Dispute.findById(req.params.disputeId).populate('order initiatedBy');

    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    if (dispute.status === 'resolved' || dispute.status === 'rejected') {
      return res.status(400).json({ message: 'Dispute already resolved' });
    }

    if (!resolution?.trim()) {
      return res.status(400).json({ message: 'Please provide a resolution' });
    }

    dispute.status = 'resolved';
    dispute.resolution = resolution.trim();
    dispute.adminNotes = adminNotes.trim();
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Notify dispute initiator
    await createNotification({
      userId: dispute.initiatedBy._id,
      actorId: req.user._id,
      orderId: dispute.order._id,
      type: 'dispute_resolved',
      title: 'Dispute resolved',
      message: `Your dispute for order #${formatOrderId(dispute.order._id)} has been resolved.`,
      link: `/orders/${dispute.order._id}`,
      metadata: { disputeId: dispute._id.toString(), resolution: resolution.trim() },
    });

    return res.json({
      message: 'Dispute resolved successfully',
      dispute,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const rejectDispute = async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { reason, adminNotes = '' } = req.body;
    const dispute = await Dispute.findById(req.params.disputeId).populate('order initiatedBy');

    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    if (dispute.status === 'resolved' || dispute.status === 'rejected') {
      return res.status(400).json({ message: 'Dispute already resolved' });
    }

    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Please provide a reason for rejection' });
    }

    dispute.status = 'rejected';
    dispute.resolution = reason.trim();
    dispute.adminNotes = adminNotes.trim();
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Notify dispute initiator
    await createNotification({
      userId: dispute.initiatedBy._id,
      actorId: req.user._id,
      orderId: dispute.order._id,
      type: 'dispute_rejected',
      title: 'Dispute rejected',
      message: `Your dispute for order #${formatOrderId(dispute.order._id)} was reviewed and rejected.`,
      link: `/orders/${dispute.order._id}`,
      metadata: { disputeId: dispute._id.toString(), reason: reason.trim() },
    });

    return res.json({
      message: 'Dispute rejected',
      dispute,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  acceptOrder,
  scheduleMeetup,
  markCompleted,
  uploadConfirmationPhoto,
  markNoShow,
  cancelOrder,
  getOrders,
  getOrderById,
  createDispute,
  getDisputes,
  getDisputeById,
  resolveDispute,
  rejectDispute,
};
