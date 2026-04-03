const express = require('express');
const Message = require('../../../models/Message');
const auth = require('../../shared/middleware/auth.middleware');

const router = express.Router();

router.get('/conversations/all', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    const users = new Map();

    messages.forEach((message) => {
      const otherUser =
        message.sender._id.toString() === req.user._id.toString()
          ? message.receiver
          : message.sender;

      if (!users.has(otherUser._id.toString())) {
        users.set(otherUser._id.toString(), {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          lastMessage: message.content,
          timestamp: message.timestamp,
        });
        return;
      }

      const existing = users.get(otherUser._id.toString());
      if (new Date(message.timestamp) > new Date(existing.timestamp)) {
        users.set(otherUser._id.toString(), {
          ...existing,
          lastMessage: message.content,
          timestamp: message.timestamp,
        });
      }
    });

    return res.json(Array.from(users.values()));
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Server Error');
  }
});

router.get('/:userId', auth, async (req, res) => {
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
});

module.exports = router;
