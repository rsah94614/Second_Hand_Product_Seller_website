const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/mongodb');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User with ID: ${userId} joined room: ${userId}`);
    });

    socket.on('send_message', async (data) => {
        const { sender, receiver, content } = data;

        // Validate required fields
        if (!sender || !receiver || !content) {
            console.error('Missing required fields:', { sender, receiver, content });
            socket.emit('error', { message: 'Missing required fields' });
            return;
        }

        // Save message to database
        try {
            const newMessage = new Message({ sender, receiver, content });
            await newMessage.save();

            // Emit to receiver's room
            io.to(receiver).emit('receive_message', newMessage);
            // Also emit back to sender for confirmation
            io.to(sender).emit('receive_message', newMessage);
        } catch (error) {
            console.error("Error saving message:", error);
            socket.emit('error', { message: 'Failed to save message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Database connection
connectDB();

// Cloudinary connection
const connectCloudinary = require('./config/cloudinary');
connectCloudinary();


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
