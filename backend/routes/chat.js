const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth'); // Assuming you have an auth middleware

// Get chat history with a specific user
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get list of conversations (users chatted with)
router.get('/conversations/all', auth, async (req, res) => {
    try {
        // Find all messages where the current user is sender or receiver
        const messages = await Message.find({
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ]
        }).populate('sender', 'name email').populate('receiver', 'name email');

        const users = new Map();

        messages.forEach(msg => {
            const otherUser = msg.sender._id.toString() === req.user.id
                ? msg.receiver
                : msg.sender;

            if (!users.has(otherUser._id.toString())) {
                users.set(otherUser._id.toString(), {
                    _id: otherUser._id,
                    name: otherUser.name,
                    email: otherUser.email,
                    lastMessage: msg.content,
                    timestamp: msg.timestamp
                });
            } else {
                // Update last message if this one is newer
                const existing = users.get(otherUser._id.toString());
                if (new Date(msg.timestamp) > new Date(existing.timestamp)) {
                    users.set(otherUser._id.toString(), {
                        ...existing,
                        lastMessage: msg.content,
                        timestamp: msg.timestamp
                    });
                }
            }
        });

        res.json(Array.from(users.values()));

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
