const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const chatController = require('./chat.controller');
const { reportLimiter } = require('../../shared/middleware/rateLimiter.middleware');

const router = express.Router();

router.get('/conversations/all', auth, chatController.getConversations);
router.get('/templates', auth, chatController.getTemplates);
router.post('/report/:userId', auth, reportLimiter, chatController.reportChat);
router.patch('/mark-read/:userId', auth, chatController.markRead);
router.get('/:userId', auth, chatController.getMessages);

module.exports = router;
