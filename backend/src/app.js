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
      }
    });

    socket.on('typing_stop', ({ receiverId } = {}) => {
      if (receiverId && typeof receiverId === 'string') {
        io.to(receiverId).emit('user_stop_typing', { userId });
      }
    });

    socket.on('send_message', async (data) => {
      const { receiver, content, productRef } = data || {};
      const sender = userId;

      if (!receiver || typeof receiver !== 'string' || !content?.trim()) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }
      if (sender === receiver) {
        socket.emit('error', { message: 'You cannot message yourself' });
        return;
      }

      const trimmed = content.trim();
      if (trimmed.length > 2000) {
        socket.emit('error', { message: 'Message too long (max 2000 chars)' });
        return;
      }

      // Anti-spam: burst + repeat check
      const spamCheck = checkMessageSpam(sender, trimmed);
      if (spamCheck.blocked) {
        socket.emit('error', { message: spamCheck.reason });
        return;
      }

      try {
        // Block check: has receiver blocked sender?
        const isBlocked = await BlockedUser.findOne({ blocker: receiver, blocked: sender });
        if (isBlocked) {
          socket.emit('error', { message: 'Unable to send message.' });
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
          return;
        }

        const hasExistingConversation = await Message.exists({
          $or: [
            { sender, receiver },
            { sender: receiver, receiver: sender },
          ],
        });

        if (!hasExistingConversation) {
          const gating = canTradeOnCampus(senderUser || {});
          if (!gating.canTrade) {
            socket.emit('error', {
              message: 'Please complete and verify your campus profile before starting a new conversation.',
              code: 'PROFILE_INCOMPLETE',
              missing: gating.missing,
            });
            return;
          }
        }

        if (senderAgeHours < 24) {
          // Count distinct conversations started today
          const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
          const distinctReceivers = await Message.distinct('receiver', {
            sender,
            timestamp: { $gte: startOfDay },
          });
          if (!distinctReceivers.includes(receiver) && distinctReceivers.length >= 5) {
            socket.emit('error', {
              message: 'New accounts can start up to 5 conversations per day. Try again tomorrow.',
            });
            return;
          }
        }

        const newMessage = new Message({
          sender,
          receiver,
          content: trimmed,
          productRef: productRef || null,
        });

        await newMessage.save();
        await newMessage.populate('sender', 'name email avatar');
        await newMessage.populate('receiver', 'name email avatar');

        io.to(receiver).emit('receive_message', newMessage);
        io.to(sender).emit('receive_message', newMessage);
      } catch (error) {
        logger.error('Error saving message:', { message: error.message });
        socket.emit('error', { message: 'Failed to save message' });
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

    socket.on('mark_seen', async ({ receiverId } = {}) => {
      try {
        if (!receiverId || typeof receiverId !== 'string') {
          return;
        }

        await Message.updateMany(
          { sender: receiverId, receiver: userId, read: false },
          { $set: { read: true } }
        );
        io.to(receiverId).emit('messages_read', { receiverId: userId });
      } catch (error) {
        logger.error('Error marking seen:', { message: error.message });
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
