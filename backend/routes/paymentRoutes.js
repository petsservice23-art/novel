const express = require('express');
const router = express.Router();
const { createPayment, verifyRazorpay, verifyPayPal, mockBuyCoins, getUserTransactions } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Middleware that populates req.user if token is present (cookie or header), but allows request if omitted
const optionalProtect = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
      // invalid token, proceed without req.user
    }
  }
  next();
};

router.get('/transactions', protect, getUserTransactions);
router.post('/create', optionalProtect, createPayment);
router.post('/create-order', optionalProtect, createPayment);
router.post('/verify-razorpay', optionalProtect, verifyRazorpay);
router.post('/verify-payment', optionalProtect, verifyRazorpay);
router.post('/verify-paypal', protect, verifyPayPal);
router.post('/mock-buy', protect, mockBuyCoins);

module.exports = router;
