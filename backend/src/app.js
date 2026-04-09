const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const {
  setNotificationIO,
} = require('./shared/utils/notification.utils');

const createApp = () => {
  const app = express();
  const server = http.createServer(app);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

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
      origin: clientUrl,
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

  app.use(cors({ origin: clientUrl, credentials: true }));
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
    
    // Broadcast presence update
    io.emit('user_online', { userId });
    console.log(`User connected: ${socket.id}, User: ${userId}. Online: ${onlineUsers.size}`);

    socket.on('get_presence', (targetUserIds) => {
      const presence = {};
      targetUserIds.forEach(id => {
        presence[id] = onlineUsers.has(id) && onlineUsers.get(id).size > 0;
      });
      socket.emit('presence_batch', presence);
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

      try {
        const newMessage = new Message({
          sender,
          receiver,
          content: content.trim(),
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

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
        }
      }
      console.log(`User disconnected: ${socket.id}. Online: ${onlineUsers.size}`);
    });
  });

  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });

  return { app, server, io };
};

module.exports = createApp;
