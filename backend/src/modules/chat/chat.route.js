const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const chatController = require('./chat.controller');

const router = express.Router();

router.get('/conversations/all', auth, chatController.getConversations);
router.patch('/mark-read/:userId', auth, chatController.markRead);
router.get('/:userId', auth, chatController.getMessages);

module.exports = router;
