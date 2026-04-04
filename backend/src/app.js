const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const {
  setNotificationIO,
  createNotification,
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

  app.use('/api/auth', require('./modules/auth/auth.route'));
  app.use('/api/products', require('./modules/products/product.route'));
  app.use('/api/users', require('./modules/users/user.route'));
  app.use('/api/cart', require('./modules/cart/cart.route'));
  app.use('/api/orders', require('./modules/orders/order.route'));
  app.use('/api/chat', require('./modules/chat/chat.route'));
  app.use('/api/admin', require('./modules/admin/admin.route'));
  app.use('/api/categories', require('./modules/categories/category.route'));
  app.use('/api/notifications', require('./modules/notifications/notification.route'));

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);
    console.log('User connected:', socket.id, 'User:', userId);

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
        await newMessage.populate('sender', 'name email');
        await newMessage.populate('receiver', 'name email');

        await createNotification({
          userId: receiver,
          actorId: sender,
          type: 'new_message',
          title: `New message from ${socket.user.name}`,
          message: content.trim().length > 80
            ? `${content.trim().slice(0, 77)}...`
            : content.trim(),
          link: '/chat',
          metadata: {
            senderId: sender,
            receiverId: receiver,
            messageId: newMessage._id.toString(),
          },
        });

        io.to(receiver).emit('receive_message', newMessage);
        io.to(sender).emit('receive_message', newMessage);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to save message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
    });
  });

  app.use(express.static(path.join(__dirname, '../../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });

  return { app, server, io };
};

module.exports = createApp;
