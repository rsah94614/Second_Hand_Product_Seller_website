const express = require('express');
const auth = require('../../shared/middleware/auth.middleware');
const chatController = require('./chat.controller');
const { reportLimiter, imageUploadLimiter } = require('../../shared/middleware/rateLimiter.middleware');
const upload = require('../../shared/middleware/upload.middleware');

const router = express.Router();

router.get('/conversations/all', auth, chatController.getConversations);
router.get('/templates', auth, chatController.getTemplates);
router.post('/report/:userId', auth, reportLimiter, chatController.reportChat);
router.patch('/mark-read/:userId', auth, chatController.markRead);
router.get('/search', auth, chatController.searchMessages);
router.post('/pin/:userId', auth, chatController.pinConversation);
router.delete('/pin/:userId', auth, chatController.unpinConversation);
router.get('/:userId', auth, chatController.getMessages);

// ── Image Sharing (Phase 3) ───────────────────────────────────────────────────
// imageUploadLimiter: max 20 uploads/hour per authenticated user
router.post('/upload-image', auth, imageUploadLimiter, upload.single('image'), chatController.uploadChatImage);

module.exports = router;
