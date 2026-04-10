const Message = require('../../../models/Message');
const mongoose = require('mongoose');

const getConversationsAggregation = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userObjectId }, { receiver: userObjectId }],
      },
    },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$sender', userObjectId] }, '$receiver', '$sender'],
        },
        lastMessage: {
          $first: {
            $cond: [{ $eq: ['$isDeleted', true] }, 'This message was deleted', '$content'],
          },
        },
        timestamp: { $first: '$timestamp' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$sender', userObjectId] },
                  { $eq: ['$read', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  // Populate user details for each conversation partner
  const User = require('../../../models/User');
  return User.populate(conversations, {
    path: '_id',
    select: 'name email avatar',
  });
};

const markMessagesAsRead = async (userId, otherUserId) => {
  return Message.updateMany(
    { sender: otherUserId, receiver: userId, read: false },
    { $set: { read: true } }
  );
};

module.exports = {
  getConversationsAggregation,
  markMessagesAsRead,
};
