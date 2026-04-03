const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/mongodb');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const User = require('./models/User');

dotenv.config();

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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));

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

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const connectCloudinary = require('./config/cloudinary');

const startServer = async () => {
  try {
    await connectDB();
    connectCloudinary();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
