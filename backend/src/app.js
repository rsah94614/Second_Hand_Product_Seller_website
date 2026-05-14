const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const { canTradeOnCampus } = require('./shared/utils/profileCompletion.utils');
const { setNotificationIO } = require('./shared/utils/notification.utils');
const logger = require('./services/logger.service');
const requestLogger = require('./shared/middleware/requestLogger.middleware');
const { validateAndSanitizeMessage } = require('./shared/utils/messageValidation.utils');
const {
  startDeliveryCleanup,
  registerPendingDelivery,
  handleDeliveryAck,
  handleReadAck,
  getPendingDeliveriesForUser,
} = require('./shared/utils/messageDelivery.utils');

const parseAllowedOrigins = () => {
  const main = process.env.CLIENT_URL || 'http://localhost:5173';
  const extra = (process.env.ADDITIONAL_CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([main, ...extra])];
};

const corsOriginHandler = (allowedList) => (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedList.includes(origin)) return callback(null, true);
  if (process.env.NODE_ENV !== 'production') return callback(null, true);
  
  console.error(`[CORS REJECTED] Origin: ${origin}. Allowed origins: ${allowedList.join(', ')}`);
  callback(new Error('Not allowed by CORS'));
};

const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);
  const server = http.createServer(app);
  const allowedOrigins = parseAllowedOrigins();
  const clientDistPath = path.join(__dirname, '../../client/dist');
  const shouldServeClient =
    process.env.SERVE_CLIENT === 'true' && fs.existsSync(clientDistPath);

  // Initialize delivery cleanup (Issue 1 & 4 fix)
  startDeliveryCleanup();

  const getSocketToken = (socket) => {
    const authToken = socket.handshake.auth?.token;
    if (authToken) {
      return authToken.replace(/Bearer\s+/i, '').trim();
    }

    const headerToken = socket.handshake.headers?.authorization;
    if (headerToken) {
      return headerToken.replace(/Bearer\s+/i, '').trim();
    }

    return null;
  };

  const io = new Server(server, {
    cors: {
      origin: corsOriginHandler(allowedOrigins),
      methods: ['GET', 'POST'],
    },
  });
  setNotificationIO(io);

  io.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('_id name email isActive');

      if (!user || user.isActive === false) {
        return next(new Error('Authentication failed'));
      }

      socket.user = user;
      return next();
    } catch (error) {
      logger.error('Socket auth failed:', { message: error.message });
      return next(new Error('Authentication failed'));
    }
  });

  app.use(
    cors({
      origin: corsOriginHandler(allowedOrigins),
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Security headers (Phase 4)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
    contentSecurityPolicy: false, // disabled — frontend handles its own CSP
  }));

  // Request logging (Phase 4)
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  });
  // Rate Limiting
  const { apiLimiter, loginLimiter, registerLimiter, userLimiter } = require('./shared/middleware/rateLimiter.middleware');
  app.use('/api', apiLimiter);
  app.use('/api', userLimiter);
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/register', registerLimiter);

  app.use('/api/auth', require('./modules/auth/auth.route'));
  app.use('/api/products', require('./modules/products/product.route'));
  app.use('/api/users', require('./modules/users/user.route'));
  app.use('/api/cart', require('./modules/cart/cart.route'));
  app.use('/api/orders', require('./modules/orders/order.route'));
  app.use('/api/chat', require('./modules/chat/chat.route'));
  app.use('/api/admin', require('./modules/admin/admin.route'));
  app.use('/api/categories', require('./modules/categories/category.route'));
  app.use('/api/notifications', require('./modules/notifications/notification.route'));
  app.use('/api/search', require('./modules/search/search.route'));

  // Global Error Handler
  const errorHandler = require('./shared/middleware/error.middleware');
  app.use(errorHandler);

  // Presence Tracking
  const onlineUsers = new Map();

  // In-memory anti-spam tracker: { userId → { msgs: timestamp[], lastContent: string, repeatCount: int } }
  const chatSpamTracker = new Map();

  // Issue 7: Periodic cleanup of spam tracker to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [userId, tracker] of chatSpamTracker.entries()) {
      // If no messages in the last 10 minutes, clear entry
      const lastMsg = tracker.msgs[tracker.msgs.length - 1];
      if (!lastMsg || now - lastMsg > 10 * 60 * 1000) {
        chatSpamTracker.delete(userId);
      }
    }
  }, 5 * 60 * 1000); // Run every 5 minutes

  const checkMessageSpam = (senderId, content) => {
    const now = Date.now();
    const BURST_WINDOW_MS = 10_000;  // 10 seconds
    const BURST_MAX = 10;            // max messages in window
    const REPEAT_MAX = 3;            // max identical messages in a row

    if (!chatSpamTracker.has(senderId)) {
      chatSpamTracker.set(senderId, { msgs: [], lastContent: '', repeatCount: 0 });
    }
    const tracker = chatSpamTracker.get(senderId);

    // Burst check
    tracker.msgs = tracker.msgs.filter((t) => now - t < BURST_WINDOW_MS);
    tracker.msgs.push(now);
    if (tracker.msgs.length > BURST_MAX) {
      return { blocked: true, reason: 'You are sending messages too fast. Please slow down.' };
    }

    // Repeat content check
    if (content === tracker.lastContent) {
      tracker.repeatCount += 1;
      if (tracker.repeatCount >= REPEAT_MAX) {
        return { blocked: true, reason: 'Please avoid sending the same message repeatedly.' };
      }
    } else {
      tracker.lastContent = content;
      tracker.repeatCount = 1;
    }

    return { blocked: false };
  };

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);
    
    // Add to presence map via Set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Typing indicator timers: { `${typerId}:${receiverId}` → timeout }
    const typingTimers = new Map();
    
    // Issue 8: Cache presence partners once on connection to avoid DB spike on disconnect
    (async () => {
      try {
        const partnerIds = await Message.distinct('sender', { receiver: userId });
        const receiverIds = await Message.distinct('receiver', { sender: userId });
        socket.partnerIds = [...new Set([...partnerIds.map(String), ...receiverIds.map(String)])];
        
        socket.partnerIds.forEach(partnerId => {
          if (partnerId !== userId) {
            io.to(partnerId).emit('user_online', { userId });
          }
        });
      } catch { /* ignore */ }
    })();

    socket.on('get_presence', (targetUserIds) => {
      if (!Array.isArray(targetUserIds)) return;
      const presence = {};
      targetUserIds.forEach(id => {
        presence[id] = onlineUsers.has(id) && onlineUsers.get(id).size > 0;
      });
      socket.emit('presence_batch', presence);
    });

    socket.on('typing_start', ({ receiverId } = {}) => {
      if (receiverId && typeof receiverId === 'string') {
        io.to(receiverId).emit('user_typing', { userId });
        io.to(receiverId).emit('typing', { userId }); // alias for App_Frontend client

        // Auto-clear after 6 seconds if typing_stop never arrives
        const key = `${userId}:${receiverId}`;
        if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));
        typingTimers.set(key, setTimeout(() => {
          io.to(receiverId).emit('user_stop_typing', { userId });
          typingTimers.delete(key);
        }, 6000));
      }
    });

    socket.on('typing_stop', ({ receiverId } = {}) => {
      if (receiverId && typeof receiverId === 'string') {
        io.to(receiverId).emit('user_stop_typing', { userId });
        const key = `${userId}:${receiverId}`;
        if (typingTimers.has(key)) {
          clearTimeout(typingTimers.get(key));
          typingTimers.delete(key);
        }
      }
    });

    // Alias: App_Frontend emits 'typing' instead of 'typing_start'
    socket.on('typing', ({ receiverId } = {}) => {
      if (receiverId && typeof receiverId === 'string') {
        io.to(receiverId).emit('user_typing', { userId });
        io.to(receiverId).emit('typing', { userId }); // alias for App_Frontend client

        const key = `${userId}:${receiverId}`;
        if (typingTimers.has(key)) clearTimeout(typingTimers.get(key));
        typingTimers.set(key, setTimeout(() => {
          io.to(receiverId).emit('user_stop_typing', { userId });
          typingTimers.delete(key);
        }, 6000));
      }
    });

    socket.on('send_message', async (data, callback) => {
      const { receiver, content, productRef, idempotencyKey } = data || {};
      const sender = userId;

      // Issue 2 Fix: Validate and sanitize message content
      const validation = validateAndSanitizeMessage({ content, receiver, productRef });
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        if (typeof callback === 'function') {
          callback({ success: false, error: validation.error });
        }
        return;
      }

      const { content: sanitizedContent, receiver: validatedReceiver, productRef: validatedProductRef } = validation.data;

      if (sender === validatedReceiver) {
        socket.emit('error', { message: 'You cannot message yourself' });
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Cannot message yourself' });
        }
        return;
      }

      // Anti-spam: burst + repeat check
      const spamCheck = checkMessageSpam(sender, sanitizedContent);
      if (spamCheck.blocked) {
        socket.emit('error', { message: spamCheck.reason });
        if (typeof callback === 'function') {
          callback({ success: false, error: spamCheck.reason });
        }
        return;
      }

      try {
        // Block check: has receiver blocked sender?
        const isBlocked = await BlockedUser.findOne({ blocker: validatedReceiver, blocked: sender });
        if (isBlocked) {
          socket.emit('error', { message: 'Unable to send message.' });
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Unable to send message' });
          }
          return;
        }

        // New account restriction: check if sender account < 24h old
        const senderUser = await User.findById(sender).select('createdAt isSuspended suspendedReason name avatar campus profileRole location emailVerified');
        const senderAgeHours = senderUser
          ? (Date.now() - new Date(senderUser.createdAt).getTime()) / (1000 * 60 * 60)
          : 999;

        if (senderUser?.isSuspended) {
          socket.emit('error', {
            message: `Your account has been suspended. Reason: ${senderUser.suspendedReason || 'Violation of campus marketplace rules.'}`,
          });
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Account suspended' });
          }
          return;
        }

        // Always check profile completion before sending any message
        const gating = canTradeOnCampus(senderUser || {});
        if (!gating.canTrade) {
          socket.emit('error', {
            message: 'Please complete and verify your campus profile before sending messages.',
            code: 'PROFILE_INCOMPLETE',
            missing: gating.missing,
          });
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Profile incomplete' });
          }
          return;
        }

        if (senderAgeHours < 24) {
          const hasExistingConversation = await Message.exists({
            $or: [
              { sender, receiver: validatedReceiver },
              { sender: validatedReceiver, receiver: sender },
            ],
          });
          if (!hasExistingConversation) {
            // Count distinct conversations started today
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const distinctReceivers = await Message.distinct('receiver', {
              sender,
              timestamp: { $gte: startOfDay },
            });
            if (!distinctReceivers.includes(validatedReceiver) && distinctReceivers.length >= 5) {
              socket.emit('error', {
                message: 'New accounts can start up to 5 conversations per day. Try again tomorrow.',
              });
              if (typeof callback === 'function') {
                callback({ success: false, error: 'Daily limit reached' });
              }
              return;
            }
          }
        }

        const newMessage = new Message({
          sender,
          receiver: validatedReceiver,
          content: sanitizedContent,
          productRef: validatedProductRef,
          ...(idempotencyKey && typeof idempotencyKey === 'string' ? { idempotencyKey } : {}),
        });

        // Task 4: Idempotency dedup — if a message with this key already exists, return it
        if (idempotencyKey && typeof idempotencyKey === 'string') {
          const existing = await Message.findOne({ idempotencyKey, sender })
            .populate('sender', 'name email avatar')
            .populate('receiver', 'name email avatar');
          if (existing) {
            // Return the existing message so the client can replace its optimistic copy
            io.to(sender).emit('receive_message', existing);
            if (typeof callback === 'function') {
              callback({ success: true, messageId: existing._id, duplicate: true });
            }
            return;
          }
        }

        await newMessage.save();
        
        // Issue 1 & 4 Fix: Register delivery tracking
        registerPendingDelivery(newMessage._id, sender, validatedReceiver);

        await newMessage.populate('sender', 'name email avatar');
        await newMessage.populate('receiver', 'name email avatar');

        // Issue 4 Fix: Send message to receiver (they will send delivery acknowledgment separately)
        io.to(validatedReceiver).emit('receive_message', newMessage);
        
        // Send message to sender as well
        io.to(sender).emit('receive_message', newMessage);

        // Issue 4 Fix: Acknowledge to sender that message was saved
        if (typeof callback === 'function') {
          callback({ success: true, messageId: newMessage._id });
        }
      } catch (error) {
        logger.error('Error saving message:', { message: error.message });
        socket.emit('error', { message: 'Failed to save message' });
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to save message' });
        }
      }
    });

    socket.on('edit_message', async ({ messageId, newContent }) => {
      try {
        if (!newContent?.trim() || newContent.trim().length > 2000) {
          return socket.emit('error', { message: 'Invalid message content' });
        }

        const message = await Message.findById(messageId);
        if (!message) return socket.emit('error', { message: 'Message not found' });
        if (message.sender.toString() !== userId) return socket.emit('error', { message: 'Unauthorized' });
        if (message.isDeleted) return socket.emit('error', { message: 'Cannot edit deleted message' });
        
        message.content = newContent.trim();
        message.isEdited = true;
        await message.save();
        await message.populate('sender', 'name email avatar');
        await message.populate('receiver', 'name email avatar');
        
        io.to(message.receiver._id.toString()).emit('message_edited', message);
        io.to(userId).emit('message_edited', message);
      } catch (error) {
        logger.error('Error editing message:', { message: error.message });
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('delete_message', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return socket.emit('error', { message: 'Message not found' });
        if (message.sender.toString() !== userId) return socket.emit('error', { message: 'Unauthorized' });
        
        message.isDeleted = true;
        message.content = '';
        await message.save();
        await message.populate('sender', 'name email avatar');
        await message.populate('receiver', 'name email avatar');
        
        io.to(message.receiver._id.toString()).emit('message_deleted', message);
        io.to(userId).emit('message_deleted', message);
      } catch (error) {
        logger.error('Error deleting message:', { message: error.message });
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('mark_seen', async ({ receiverId } = {}, callback) => {
      try {
        if (!receiverId || typeof receiverId !== 'string') {
          return;
        }

        // Issue 1 Fix: Only mark as read after delivery is confirmed
        // Get pending deliveries for this user
        const pendingDeliveries = getPendingDeliveriesForUser(userId);

        // Update messages in database
        const result = await Message.updateMany(
          { sender: receiverId, receiver: userId, read: false },
          { $set: { read: true, readAt: new Date() } }
        );

        io.to(receiverId).emit('messages_read', { receiverId: userId });

        // Acknowledge to client
        if (typeof callback === 'function') {
          callback({ success: true, markedCount: result.modifiedCount });
        }
      } catch (error) {
        logger.error('Error marking seen:', { message: error.message });
        if (typeof callback === 'function') {
          callback({ success: false, error: error.message });
        }
      }
    });

    // Issue 1 & 4 Fix: Delivery acknowledgment handler
    socket.on('message_delivered', async ({ messageId }, callback) => {
      const result = handleDeliveryAck(messageId, userId);
      if (result.success) {
        try {
          // Persist delivery status to MongoDB
          await Message.findByIdAndUpdate(messageId, {
            $set: { delivered: true, deliveredAt: new Date() },
          });
          // Notify sender that message was delivered
          const msg = await Message.findById(messageId).select('sender');
          if (msg) {
            io.to(msg.sender.toString()).emit('message_status_update', {
              messageId,
              status: 'delivered',
              deliveredAt: new Date(),
            });
          }
        } catch (error) {
          logger.error('Error persisting delivery ack:', { message: error.message });
        }
      }
      if (typeof callback === 'function') {
        callback(result);
      }
    });

    // Issue 1 & 4 Fix: Read acknowledgment handler
    socket.on('message_read', async ({ messageId }, callback) => {
      const result = handleReadAck(messageId, userId);
      if (result.success) {
        try {
          // Persist read status to MongoDB
          await Message.findByIdAndUpdate(messageId, {
            $set: { read: true, readAt: new Date() },
          });
          // Notify sender that message was read
          const msg = await Message.findById(messageId).select('sender');
          if (msg) {
            io.to(msg.sender.toString()).emit('message_status_update', {
              messageId,
              status: 'read',
              readAt: new Date(),
            });
          }
        } catch (error) {
          logger.error('Error persisting read ack:', { message: error.message });
        }
      }
      if (typeof callback === 'function') {
        callback(result);
      }
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Scoped offline broadcast using cached partner IDs (Issue 8 fix)
          if (socket.partnerIds) {
            socket.partnerIds.forEach(partnerId => {
              if (partnerId !== userId) {
                io.to(partnerId).emit('user_offline', { userId });
              }
            });
          }
        }
      }

      // Clear all typing timers for this user on disconnect
      for (const [key, timer] of typingTimers.entries()) {
        if (key.startsWith(`${userId}:`)) {
          clearTimeout(timer);
          typingTimers.delete(key);
        }
      }
    });
  });

  if (shouldServeClient) {
    app.use(express.static(clientDistPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return { app, server, io };
};

module.exports = createApp;
