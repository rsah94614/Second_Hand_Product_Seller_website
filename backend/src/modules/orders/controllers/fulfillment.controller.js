const Order = require('../../../../models/Order');
const Product = require('../../../../models/Product');
const { createNotification } = require('../../../shared/utils/notification.utils');
const cloudinary = require('cloudinary').v2;

const formatOrderId = (id) => id.toString().slice(-6).toUpperCase();

const markDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'title _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the seller can mark this order as handed over' });
    }
    if (!['accepted', 'meetup_scheduled'].includes(order.status)) {
      return res.status(400).json({ message: `Cannot deliver an order with status "${order.status}"` });
    }

    order.status = 'delivered';
    order.deliveredAt = Date.now();
    await order.save();

    await createNotification({
      userId: order.user,
      actorId: req.user._id,
      orderId: order._id,
      type: 'order_delivered',
      title: 'Item Handed Over 📦',
      message: `${req.user.name} marked "${order.items[0]?.title}" as handed over. Please confirm receipt.`,
      link: '/orders',
      metadata: { status: 'delivered' },
    });

    return res.json({ message: 'Order marked as handed over', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markCompleted = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'title _id');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the buyer can confirm completion' });
    }
    if (!['accepted', 'meetup_scheduled', 'delivered'].includes(order.status)) {
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

const uploadConfirmationPhoto = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) return res.status(403).json({ message: 'Not authorized' });

    if (!['meetup_scheduled', 'completed'].includes(order.status)) {
      return res.status(400).json({ message: 'Confirmation photo can only be uploaded for scheduled or completed orders' });
    }

    if (!req.file) return res.status(400).json({ message: 'Please upload a photo' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'campusmitra/order-confirmations',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
      ],
    });

    order.confirmationPhoto = { url: result.secure_url, uploadedBy: req.user._id, uploadedAt: new Date() };
    await order.save();

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

    return res.json({ message: 'Confirmation photo uploaded successfully', order, photoUrl: result.secure_url });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const autoCompleteOrders = async (req, res) => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const orders = await Order.find({
      status: 'delivered',
      deliveredAt: { $lte: fortyEightHoursAgo },
    }).populate('items.product', 'title _id');

    let completedCount = 0;
    for (const order of orders) {
      order.status = 'completed';
      order.reviewUnlocked = true;
      await order.save();

      const stockUpdates = order.items.map(async (item) => {
        const p = await Product.findById(item.product);
        if (p) {
          const newStock = Math.max(0, p.stock - item.quantity);
          p.stock = newStock;
          if (newStock === 0) { p.isSold = true; p.isActive = false; }
          await p.save();
        }
      });
      await Promise.all(stockUpdates);

      await Promise.all([
        createNotification({
          userId: order.seller,
          actorId: req.user?._id,
          orderId: order._id,
          type: 'order_completed',
          title: 'Auto-Completed! ⏳',
          message: `The 48h window passed for "${order.items[0]?.title}". The deal is now officially completed.`,
          link: '/orders',
          metadata: { status: 'completed' },
        }),
        createNotification({
          userId: order.user,
          actorId: req.user?._id,
          orderId: order._id,
          type: 'order_completed',
          title: 'Auto-Completed! ⏳',
          message: `Your order for "${order.items[0]?.title}" was auto-completed. You can now leave a review.`,
          link: '/orders',
          metadata: { status: 'completed', reviewUnlocked: true },
        }),
      ]);
      completedCount++;
    }
    return res.json({ message: `Successfully auto-completed ${completedCount} orders`, count: completedCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { markDelivered, markCompleted, uploadConfirmationPhoto, autoCompleteOrders };
