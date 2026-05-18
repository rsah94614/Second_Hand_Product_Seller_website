const Order = require('../../../../models/Order');

const getOrders = async (req, res) => {
  try {
    const query = {
      $or: [
        { user: req.user._id },
        { seller: req.user._id }
      ]
    };

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

module.exports = { getOrders, getOrderById };
