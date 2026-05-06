const Report = require('../../../../models/Report');
const ModerationQueue = require('../../../../models/ModerationQueue');
const { logAuditAction } = require('../../../shared/utils/audit.utils');
const { createNotification } = require('../../../shared/utils/notification.utils');
const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value));

const getReports = async (req, res) => {
  try {
    const { cursor, limit = 50, status = '', targetType = '' } = req.query;
    const query = {};

    if (cursor && isValidObjectId(cursor)) query._id = { $lt: cursor };
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const numericLimit = Number(limit);
    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('product', 'title images category')
      .populate('message', 'content timestamp')
      .sort({ _id: -1 })
      .limit(numericLimit);

    const total = await Report.countDocuments(query);
    const nextCursor = reports.length === numericLimit ? reports[reports.length - 1]._id.toString() : null;

    return res.json({ reports, nextCursor, total });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const { status, adminNotes = '' } = req.body;
    const allowedStatuses = ['open', 'reviewed', 'resolved', 'dismissed'];

    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid report status' });

    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .populate('product', 'title images category');

    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = status;
    report.adminNotes = adminNotes.trim();
    await report.save();

    await createNotification({
      userId: report.reporter._id,
      actorId: req.user._id,
      productId: report.product?._id,
      reportId: report._id,
      type: 'report_status_updated',
      title: 'Report status updated',
      message: `Your ${report.targetType} report is now ${status}.${report.adminNotes ? ' Admin notes were added.' : ''}`,
      link: '/notifications',
      metadata: { status, targetType: report.targetType },
    });

    await logAuditAction({ action: 'REPORT_STATUS_UPDATED', actor: req.user._id, targetType: 'Report', targetId: report._id, details: { newStatus: status, adminNotes }, req });
    return res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getModerationQueue = async (req, res) => {
  try {
    const { status, priority, itemType, assignedTo, cursor, limit = 50 } = req.query;
    const query = {};

    if (cursor && isValidObjectId(cursor)) query._id = { $lt: cursor };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (itemType) query.itemType = itemType;
    if (assignedTo === 'me') {
      query.assignedTo = req.user._id;
    } else if (assignedTo === 'unassigned') {
      query.assignedTo = null;
    } else if (assignedTo && isValidObjectId(assignedTo)) {
      query.assignedTo = assignedTo;
    }

    const numericLimit = Number(limit);
    const items = await ModerationQueue.find(query).populate('assignedTo', 'name email').sort({ _id: -1 }).limit(numericLimit);
    const nextCursor = items.length === numericLimit ? items[items.length - 1]._id.toString() : null;

    const stats = await ModerationQueue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const statusCounts = stats.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {});

    return res.json({
      items,
      nextCursor,
      stats: {
        pending: statusCounts.pending || 0,
        in_progress: statusCounts.in_progress || 0,
        resolved: statusCounts.resolved || 0,
        total: (statusCounts.pending || 0) + (statusCounts.in_progress || 0) + (statusCounts.resolved || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addToModerationQueue = async (req, res) => {
  try {
    const { itemType, itemId, reason, priority = 'medium', metadata = {} } = req.body;
    const validTypes = ['product', 'user', 'order', 'review', 'report'];
    if (!validTypes.includes(itemType)) return res.status(400).json({ message: 'Invalid item type' });
    if (!itemId || !isValidObjectId(itemId)) return res.status(400).json({ message: 'Invalid item ID' });
    if (!reason?.trim()) return res.status(400).json({ message: 'Reason is required' });

    const existing = await ModerationQueue.findOne({ itemType, itemId, status: { $in: ['pending', 'in_progress'] } });
    if (existing) return res.status(400).json({ message: 'Item already in moderation queue' });

    const queueItem = await ModerationQueue.create({ itemType, itemId, reason: reason.trim(), priority, metadata });
    await logAuditAction({ action: 'MODERATION_QUEUE_ADDED', actor: req.user._id, targetType: 'ModerationQueue', targetId: queueItem._id, details: { itemType, itemId, reason, priority }, req });

    return res.status(201).json({ message: 'Item added to moderation queue', item: queueItem });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const assignModerationItem = async (req, res) => {
  try {
    const { adminId } = req.body;
    const item = await ModerationQueue.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Moderation item not found' });
    if (item.status === 'resolved') return res.status(400).json({ message: 'Cannot assign resolved item' });

    item.assignedTo = adminId || req.user._id;
    item.status = 'in_progress';
    await item.save();

    const populatedItem = await ModerationQueue.findById(item._id).populate('assignedTo', 'name email');
    await logAuditAction({ action: 'MODERATION_ITEM_ASSIGNED', actor: req.user._id, targetType: 'ModerationQueue', targetId: item._id, details: { assignedTo: item.assignedTo }, req });

    return res.json({ message: 'Moderation item assigned', item: populatedItem });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resolveModerationItem = async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!resolution?.trim()) return res.status(400).json({ message: 'Resolution is required' });

    const item = await ModerationQueue.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Moderation item not found' });
    if (item.status === 'resolved') return res.status(400).json({ message: 'Item already resolved' });

    item.status = 'resolved';
    item.resolution = resolution.trim();
    item.resolvedAt = new Date();
    await item.save();

    await logAuditAction({ action: 'MODERATION_ITEM_RESOLVED', actor: req.user._id, targetType: 'ModerationQueue', targetId: item._id, details: { resolution }, req });
    return res.json({ message: 'Moderation item resolved', item });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getModerationStats = async (req, res) => {
  try {
    const [statusStats, priorityStats, typeStats, assignmentStats] = await Promise.all([
      ModerationQueue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      ModerationQueue.aggregate([{ $match: { status: { $ne: 'resolved' } } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      ModerationQueue.aggregate([{ $match: { status: { $ne: 'resolved' } } }, { $group: { _id: '$itemType', count: { $sum: 1 } } }]),
      ModerationQueue.aggregate([{ $match: { status: { $ne: 'resolved' } } }, { $group: { _id: { $cond: [{ $eq: ['$assignedTo', null] }, 'unassigned', 'assigned'] }, count: { $sum: 1 } } }]),
    ]);

    const stats = {
      byStatus: statusStats.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
      byPriority: priorityStats.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
      byType: typeStats.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
      byAssignment: assignmentStats.reduce((acc, item) => { acc[item._id] = item.count; return acc; }, {}),
    };

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getReports, updateReport, getModerationQueue, addToModerationQueue, assignModerationItem, resolveModerationItem, getModerationStats };
