const User = require('../../../../models/User');
const Order = require('../../../../models/Order');
const { logAuditAction } = require('../../../shared/utils/audit.utils');
const { createNotification } = require('../../../shared/utils/notification.utils');
const mongoose = require('mongoose');

const escapeRegex = (text) => String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const getOrders = async (req, res) => {
  try {
    const { cursor, limit = 50, status = '', search = '' } = req.query;
    const query = {};

    if (cursor && isValidObjectId(cursor)) query._id = { $lt: cursor };
    if (status) query.status = status;

    const numericLimit = Number(limit);

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      const userMatchIds = await User.find({
        $or: [{ name: { $regex: searchRegex } }, { email: { $regex: searchRegex } }],
      }).select('_id');

      const userIds = userMatchIds.map((u) => u._id);
      query.$or = [
        { 'items.title': { $regex: searchRegex } },
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ];
    }

    const orders = await Order.find(query).populate('user', 'name email location').sort({ _id: -1 }).limit(numericLimit);
    const total = await Order.countDocuments(query);
    const nextCursor = orders.length === numericLimit ? orders[orders.length - 1]._id.toString() : null;

    return res.json({ orders, nextCursor, total });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['requested', 'accepted', 'meetup_scheduled', 'completed', 'cancelled', 'no_show'];

    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid order status' });

    const order = await Order.findById(req.params.id).populate('user', 'name email location');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    await order.save();

    await createNotification({
      userId: order.user._id,
      actorId: req.user._id,
      orderId: order._id,
      type: 'order_status_updated',
      title: 'Order status updated',
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${status}.`,
      link: '/orders',
      metadata: { status },
    });

    await logAuditAction({ action: 'ORDER_STATUS_UPDATED', actor: req.user._id, targetType: 'Order', targetId: order._id, details: { newStatus: status }, req });

    return res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getOrders, updateOrder };
