const Order = require('../../../../models/Order');
const Dispute = require('../../../../models/Dispute');
const User = require('../../../../models/User');
const { createNotification } = require('../../../shared/utils/notification.utils');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const formatOrderId = (id) => id.toString().slice(-6).toUpperCase();

const createDispute = async (req, res) => {
  const tempFilePaths = (req.files || []).map((f) => f.path).filter(Boolean);
  try {
    const { reason, description } = req.body;
    const order = await Order.findById(req.params.id).populate('user seller', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isBuyer = order.user._id.toString() === req.user._id.toString();
    const isSeller = order.seller?._id?.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller) return res.status(403).json({ message: 'Not authorized' });

    if (!['completed', 'no_show'].includes(order.status)) {
      return res.status(400).json({ message: 'Disputes can only be filed for completed or no-show orders' });
    }

    const existingDispute = await Dispute.findOne({ order: order._id, status: { $in: ['open', 'under_review'] } });
    if (existingDispute) return res.status(400).json({ message: 'An active dispute already exists' });

    if (!['damaged', 'not_received', 'not_as_described', 'other'].includes(reason)) return res.status(400).json({ message: 'Invalid dispute reason' });
    if (!description?.trim()) return res.status(400).json({ message: 'Please provide a description' });

    const evidenceUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'campusmitra/dispute-evidence',
          transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto:good' }],
        });
        evidenceUrls.push(result.secure_url);
      }
    }

    const dispute = await Dispute.create({ order: order._id, initiatedBy: req.user._id, reason, description: description.trim(), evidence: evidenceUrls, status: 'open' });

    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    if (admins.length > 0) {
      await Promise.all(admins.map(admin => createNotification({
        userId: admin._id, actorId: req.user._id, orderId: order._id, type: 'new_dispute',
        title: 'New dispute filed', message: `${req.user.name} filed a dispute for order #${formatOrderId(order._id)}.`,
        link: '/admin/disputes', metadata: { disputeId: dispute._id.toString(), reason }
      })));
    }

    const notifyUserId = isBuyer ? order.seller._id : order.user._id;
    await createNotification({
      userId: notifyUserId, actorId: req.user._id, orderId: order._id, type: 'dispute_filed',
      title: 'Dispute filed', message: `A dispute was filed for order #${formatOrderId(order._id)}.`,
      link: `/orders/${order._id}`, metadata: { disputeId: dispute._id.toString(), reason }
    });

    return res.status(201).json({ message: 'Dispute filed successfully', dispute });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  } finally {
    // Clean up temp files regardless of success or failure
    tempFilePaths.forEach((p) => { try { fs.unlinkSync(p); } catch { /* ignore */ } });
  }
};

const getDisputes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    const { status } = req.query;
    const query = {};
    if (status && ['open', 'under_review', 'resolved', 'rejected'].includes(status)) query.status = status;

    const disputes = await Dispute.find(query).populate('order', 'items total status').populate('initiatedBy', 'name email').populate('resolvedBy', 'name').sort({ createdAt: -1 });
    return res.json(disputes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.disputeId).populate('order').populate('initiatedBy', 'name email').populate('resolvedBy', 'name');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    const order = await Order.findById(dispute.order._id);
    const isBuyer = order.user.toString() === req.user._id.toString();
    const isSeller = order.seller?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) return res.status(403).json({ message: 'Not authorized' });
    return res.json(dispute);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    const { resolution, adminNotes = '' } = req.body;
    const dispute = await Dispute.findById(req.params.disputeId).populate('order initiatedBy');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    if (dispute.status === 'resolved' || dispute.status === 'rejected') return res.status(400).json({ message: 'Dispute already resolved' });
    if (!resolution?.trim()) return res.status(400).json({ message: 'Please provide a resolution' });

    dispute.status = 'resolved';
    dispute.resolution = resolution.trim();
    dispute.adminNotes = adminNotes.trim();
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    await createNotification({
      userId: dispute.initiatedBy._id, actorId: req.user._id, orderId: dispute.order._id, type: 'dispute_resolved',
      title: 'Dispute resolved', message: `Your dispute for order #${formatOrderId(dispute.order._id)} has been resolved.`,
      link: `/orders/${dispute.order._id}`, metadata: { disputeId: dispute._id.toString(), resolution: resolution.trim() }
    });

    return res.json({ message: 'Dispute resolved successfully', dispute });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const rejectDispute = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    const { reason, adminNotes = '' } = req.body;
    const dispute = await Dispute.findById(req.params.disputeId).populate('order initiatedBy');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    if (dispute.status === 'resolved' || dispute.status === 'rejected') return res.status(400).json({ message: 'Dispute already resolved' });
    if (!reason?.trim()) return res.status(400).json({ message: 'Please provide a reason for rejection' });

    dispute.status = 'rejected';
    dispute.resolution = reason.trim();
    dispute.adminNotes = adminNotes.trim();
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    await createNotification({
      userId: dispute.initiatedBy._id, actorId: req.user._id, orderId: dispute.order._id, type: 'dispute_rejected',
      title: 'Dispute rejected', message: `Your dispute for order #${formatOrderId(dispute.order._id)} was reviewed and rejected.`,
      link: `/orders/${dispute.order._id}`, metadata: { disputeId: dispute._id.toString(), reason: reason.trim() }
    });

    return res.json({ message: 'Dispute rejected', dispute });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createDispute, getDisputes, getDisputeById, resolveDispute, rejectDispute };
