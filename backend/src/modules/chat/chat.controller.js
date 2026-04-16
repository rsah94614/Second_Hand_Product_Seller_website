const Message = require('../../../models/Message');
const Report = require('../../../models/Report');
const User = require('../../../models/User');
const { getConversationsAggregation, markMessagesAsRead } = require('./chat.service');
const { createNotification } = require('../../shared/utils/notification.utils');

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

const getTemplates = async (req, res) => {
  const templates = [
    { text: "Hi, is this still available?" },
    { text: "Can we negotiate the price a bit?" },
    { text: "Where on campus can we meet to exchange this?" },
    { text: "I can meet you at the Library. Does that work?" },
    { text: "I can meet you at the Main Gate. Let me know when." },
    { text: "Could you send some more pictures?" },
    { text: "I'm interested. Let's schedule a time to meet." }
  ];
  return res.json(templates);
};

const reportChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, details = '', messageId = null, productId = null } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Report reason is required' });
    }
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report yourself' });
    }

    const targetUser = await User.findById(userId).select('_id name');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (messageId) {
      const message = await Message.findById(messageId).select('sender receiver');
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      const participants = [message.sender.toString(), message.receiver.toString()];
      if (!participants.includes(req.user._id.toString()) || !participants.includes(userId)) {
        return res.status(400).json({ message: 'This message is not part of your conversation with the reported user.' });
      }
    }

    const duplicate = await Report.findOne({
      reporter: req.user._id,
      reportedUser: userId,
      targetType: 'chat',
      message: messageId || null,
      status: { $in: ['open', 'reviewed'] },
    });

    if (duplicate) {
      return res.status(400).json({ message: 'You have already reported this chat issue.' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: userId,
      product: productId || null,
      message: messageId || null,
      targetType: 'chat',
      reason: reason.trim(),
      details: details.trim(),
    });

    await createNotification({
      userId: req.user._id,
      actorId: req.user._id,
      reportId: report._id,
      type: 'chat_reported',
      title: 'Chat reported',
      message: `Your report about ${targetUser.name} has been submitted for moderation review.`,
      link: '/notifications',
      metadata: { targetType: 'chat', reportedUserId: userId },
    });

    return res.status(201).json({ message: 'Chat report submitted successfully', report });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  markRead,
  getTemplates,
  reportChat,
};
