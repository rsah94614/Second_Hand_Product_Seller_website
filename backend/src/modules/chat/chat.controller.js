const Message = require('../../../models/Message');
const { getConversationsAggregation, markMessagesAsRead } = require('./chat.service');

const getConversations = async (req, res) => {
  try {
    const popConversations = await getConversationsAggregation(req.user._id);

    const formattedConversations = popConversations.map((conv) => {
      const otherUser = conv._id;
      return {
        _id: otherUser ? otherUser._id : 'unknown',
        name: otherUser ? otherUser.name : 'Unknown User',
        email: otherUser ? otherUser.email : '',
        lastMessage: conv.lastMessage,
        timestamp: conv.timestamp,
        unreadCount: conv.unreadCount,
      };
    });

    return res.json(formattedConversations);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server Error');
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    }).sort({ timestamp: 1 });

    return res.json(messages);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server Error');
  }
};

const markRead = async (req, res) => {
  try {
    await markMessagesAsRead(req.user._id, req.params.userId);
    return res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server Error');
  }
};

module.exports = {
  getConversations,
  getMessages,
  markRead,
};
