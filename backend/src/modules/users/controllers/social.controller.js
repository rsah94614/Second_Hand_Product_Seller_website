const User = require('../../../../models/User');
const BlockedUser = require('../../../../models/BlockedUser');

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    const target = await User.findById(userId).select('_id name');
    if (!target) return res.status(404).json({ message: 'User not found' });

    const existing = await BlockedUser.findOne({ blocker: req.user._id, blocked: userId });
    if (existing) {
      return res.status(400).json({ message: 'You have already blocked this user' });
    }

    await BlockedUser.create({ blocker: req.user._id, blocked: userId });

    return res.json({ message: `${target.name} has been blocked. They can no longer send you messages.` });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already blocked this user' });
    }
    return res.status(500).json({ message: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = await BlockedUser.findOneAndDelete({ blocker: req.user._id, blocked: userId });
    if (!deleted) return res.status(404).json({ message: 'Block record not found' });
    return res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await BlockedUser.find({ blocker: req.user._id })
      .populate('blocked', 'name avatar')
      .sort({ createdAt: -1 });

    return res.json({ blocked: blocks.map((b) => b.blocked) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  getBlockedUsers,
};
