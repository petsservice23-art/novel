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

// CORS Setup
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('segyenovels.space')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));

// Explicit CORS headers safeguard for preflights and error states
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('segyenovels.space') || origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Large payload support (up to 100MB for book imports and base64 artwork)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// Define routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/novels', require('./routes/novelRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
// Standalone Razorpay Standard Checkout route aliases
const optionalAuth = async (req, res, next) => {
  let token = req.cookies?.jwt;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('./models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (e) {}
  }
  next();
};
app.post('/api/create-order', optionalAuth, require('./controllers/paymentController').createPayment);
app.post('/api/verify-payment', optionalAuth, require('./controllers/paymentController').verifyRazorpay);
app.use('/api/chapters', require('./routes/chapterRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/retention', require('./routes/retentionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'API is running' }));

// Global error handler with CORS guarantees
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('segyenovels.space') || origin.includes('vercel.app') || origin.includes('localhost'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    methods: ['GET', 'POST'],
    credentials: true
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
