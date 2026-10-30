const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());

// Define routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/novels', require('./routes/novelRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/chapters', require('./routes/chapterRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/retention', require('./routes/retentionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'API is running' }));

const PORT = process.env.PORT || 5000;

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected via Socket:', socket.id);

  // Killer Feature: Join a specific chapter room for live paragraph comments
  socket.on('join_chapter', (chapterId) => {
    socket.join(chapterId);
    console.log(`Socket ${socket.id} joined chapter ${chapterId}`);
  });

  socket.on('new_paragraph_comment', (data) => {
    // data: { chapterId, paragraphIndex, comment, user }
    // Broadcast to everyone else in the chapter room
    socket.to(data.chapterId).emit('receive_comment', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
