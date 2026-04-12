const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const {
  setNotificationIO,
} = require('./shared/utils/notification.utils');

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
  callback(new Error('Not allowed by CORS'));
};

const createApp = () => {
  const app = express();
  const server = http.createServer(app);
  const allowedOrigins = parseAllowedOrigins();
  const clientDistPath = path.join(__dirname, '../../client/dist');
  const shouldServeClient =
    process.env.SERVE_CLIENT === 'true' && fs.existsSync(clientDistPath);

  const getSocketToken = (socket) => {
    const authToken = socket.handshake.auth?.token;
    if (authToken) {
      return authToken.replace('Bearer ', '');
    }

    const headerToken = socket.handshake.headers?.authorization;
    if (headerToken) {
      return headerToken.replace('Bearer ', '');
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
      const user = await User.findById(decoded.userId).select('_id name email');

      if (!user) {
        return next(new Error('Authentication failed'));
      }

      socket.user = user;
      return next();
    } catch (error) {
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

  // Observability: Log all incoming requests
  // const requestLogger = require('./shared/middleware/requestLogger.middleware');
  // app.use(requestLogger);

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
  const { apiLimiter } = require('./shared/middleware/rateLimiter.middleware');
  app.use('/api', apiLimiter);

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

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);
    
    // Add to presence map via Set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    
    // Broadcast presence only to users who have chatted with this user
    (async () => {
      try {
        const partnerIds = await Message.distinct('sender', { receiver: userId });
        const receiverIds = await Message.distinct('receiver', { sender: userId });
        const uniquePartners = [...new Set([...partnerIds.map(String), ...receiverIds.map(String)])];
        uniquePartners.forEach(partnerId => {
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

    socket.on('typing_start', ({ receiverId }) => {
      if (receiverId && typeof receiverId === 'string') {
        io.to(receiverId).emit('user_typing', { userId });
      }
    });

    socket.on('typing_stop', ({ receiverId }) => {
      if (receiverId && typeof receiverId === 'string') {
        io.to(receiverId).emit('user_stop_typing', { userId });
      }
    });

    socket.on('send_message', async (data) => {
      const { receiver, content } = data;
      const sender = userId;

      if (!receiver || !content?.trim()) {
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

      try {
        const newMessage = new Message({
          sender,
          receiver,
          content: trimmed,
        });

        await newMessage.save();
        await newMessage.populate('sender', 'name email avatar');
        await newMessage.populate('receiver', 'name email avatar');

        io.to(receiver).emit('receive_message', newMessage);
        io.to(sender).emit('receive_message', newMessage);
      } catch (error) {
        console.error('Error saving message:', error);
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
        console.error('Error editing message:', error);
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
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('mark_seen', async ({ receiverId }) => {
      try {
        await Message.updateMany(
          { sender: receiverId, receiver: userId, read: false },
          { $set: { read: true } }
        );
        io.to(receiverId).emit('messages_read', { receiverId: userId });
      } catch (error) {
        console.error('Error marking seen:', error);
      }
    });

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          // Scoped offline broadcast
          (async () => {
            try {
              const partnerIds = await Message.distinct('sender', { receiver: userId });
              const receiverIds = await Message.distinct('receiver', { sender: userId });
              const uniquePartners = [...new Set([...partnerIds.map(String), ...receiverIds.map(String)])];
              uniquePartners.forEach(partnerId => {
                if (partnerId !== userId) {
                  io.to(partnerId).emit('user_offline', { userId });
                }
              });
            } catch { /* ignore */ }
          })();
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
