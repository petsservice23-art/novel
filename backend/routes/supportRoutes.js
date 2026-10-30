const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getThread,
  getAdminTickets,
  replyTicket
} = require('../controllers/supportController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// Optional auth middleware: attaches user if logged in, otherwise continues as guest
const optionalAuth = async (req, res, next) => {
  let token = req.cookies?.jwt;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (err) {
      // Invalid token, proceed as guest
    }
  }
  next();
};

router.post('/message', optionalAuth, sendMessage);
router.get('/thread', optionalAuth, getThread);

// Admin endpoints
router.get('/admin/tickets', protect, authorize('admin'), getAdminTickets);
router.post('/admin/reply', protect, authorize('admin'), replyTicket);

module.exports = router;
