const Message = require('../../../models/Message');
const Report = require('../../../models/Report');
const User = require('../../../models/User');
const { getConversationsAggregation, markMessagesAsRead } = require('./chat.service');
const { createNotification } = require('../../shared/utils/notification.utils');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

const getConversations = async (req, res) => {
  try {
    const popConversations = await getConversationsAggregation(req.user._id);

    // Get pinned conversation IDs for this user
    const currentUser = await User.findById(req.user._id).select('pinnedConversations').lean();
    const pinnedIds = new Set(
      (currentUser?.pinnedConversations || []).map((id) => id.toString())
    );

    const formattedConversations = popConversations.map((conv) => {
      const otherUser = conv._id;
      const otherId = otherUser?._id?.toString();
      return {
        _id: otherId || 'unknown',
        name: otherUser ? otherUser.name : 'Unknown User',
        email: otherUser ? otherUser.email : '',
        lastMessage: conv.lastMessage,
        timestamp: conv.timestamp,
        unreadCount: conv.unreadCount,
        isPinned: pinnedIds.has(otherId),
      };
    });

    // Sort: pinned first, then by timestamp
    formattedConversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
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

// ─── Message Search (Phase 3 - Task 3.1.1) ───────────────────────────────────

const searchMessages = async (req, res) => {
  try {
    const { q, userId, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchRegex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const cap = Math.min(parseInt(limit, 10) || 20, 100);

    // Build query - search in user's conversations
    const query = {
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
      content: { $regex: searchRegex },
      isDeleted: false,
    };

    // Optionally filter by specific conversation partner
    if (userId) {
      query.$or = [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ];
    }

    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ timestamp: -1 })
      .limit(cap)
      .lean();

    return res.json({
      messages,
      total: messages.length,
      query: q.trim(),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Conversation Pinning (Phase 3 - Task 3.1.3) ─────────────────────────────

const pinConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    const targetUser = await User.findById(userId).select('_id name');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id).select('pinnedConversations');
    const alreadyPinned = currentUser.pinnedConversations.some(
      (id) => id.toString() === userId
    );

    if (alreadyPinned) {
      return res.status(400).json({ message: 'Conversation already pinned' });
    }

    // Max 5 pinned conversations
    if (currentUser.pinnedConversations.length >= 5) {
      return res.status(400).json({ message: 'Maximum 5 conversations can be pinned' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { pinnedConversations: userId },
    });

    return res.json({ message: `Conversation with ${targetUser.name} pinned` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const unpinConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pinnedConversations: userId },
    });

    return res.json({ message: 'Conversation unpinned' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── Image Sharing (Phase 3) ──────────────────────────────────────────────────

const uploadChatImage = async (req, res) => {
  const tempPath = req.file?.path;
  
  try {
    const { receiverId, content = '' } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId).select('_id name');
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if users are blocked
    const BlockedUser = require('../../../models/BlockedUser');
    const blocked = await BlockedUser.findOne({
      $or: [
        { blocker: req.user._id, blocked: receiverId },
        { blocker: receiverId, blocked: req.user._id },
      ],
    });

    if (blocked) {
      return res.status(403).json({ message: 'Cannot send messages to this user' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'campusmitra-chat',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Max dimensions
        { quality: 'auto:good' }, // Automatic quality optimization
        { fetch_format: 'auto' }, // Automatic format selection
      ],
    });

    // Create message with image
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim() || '', // Optional caption
      image: result.secure_url,
      imageMetadata: {
        width: result.width,
        height: result.height,
        size: result.bytes,
        format: result.format,
      },
    });

    // Populate sender info
    await message.populate('sender', 'name avatar');

    // Send notification to receiver
    await createNotification({
      userId: receiverId,
      actorId: req.user._id,
      type: 'new_message',
      title: 'New message',
      message: `${req.user.name} sent you ${content.trim() ? 'an image with a message' : 'an image'}`,
      link: `/chat/${req.user._id}`,
      metadata: {
        hasImage: true,
        messageId: message._id,
      },
    });

    // Emit socket event if socket.io is available
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('new_message', message);
    }

    return res.status(201).json({
      message: 'Image sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Chat image upload error:', error);
    return res.status(500).json({ message: error.message });
  } finally {
    // Clean up temp file
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }
  }
};

module.exports = {
  getConversations,
  getMessages,
  markRead,
  getTemplates,
  reportChat,
  searchMessages,
  pinConversation,
  unpinConversation,
  uploadChatImage,
};
