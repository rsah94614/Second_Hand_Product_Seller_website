const Order = require('../../../../models/Order');
const { createNotification } = require('../../../shared/utils/notification.utils');

const formatOrderId = (id) => id.toString().slice(-6).toUpperCase();

const cancelOrder = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const order = await Order.findById(req.params.id).populate('items.product', 'seller title');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) return res.status(403).json({ message: 'Not authorized' });

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
        message: `${req.user.name} cancelled order #${formatOrderId(order._id)}${reason.trim() ? `: ${reason.trim()}` : '.'}`,
        link: '/orders',
        metadata: { status: 'cancelled', cancelledBy: order.cancelledBy },
      });
    }

    return res.json({ message: 'Order cancelled', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const markNoShow = async (req, res) => {
  try {
    const { noShowBy, reason = '' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) return res.status(403).json({ message: 'Not authorized' });

    if (order.status !== 'meetup_scheduled') {
      return res.status(400).json({ message: 'No-show can only be reported for scheduled meetup orders' });
    }
    if (!['buyer', 'seller'].includes(noShowBy)) return res.status(400).json({ message: 'noShowBy must be "buyer" or "seller"' });

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
      message: `A no-show was reported on order #${formatOrderId(order._id)}.`,
      link: '/orders',
      metadata: { noShowBy },
    });

    return res.json({ message: 'No-show reported', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { cancelOrder, markNoShow };
