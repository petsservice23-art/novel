const express = require('express');
const router = express.Router();
const { createPayment, verifyRazorpay, verifyPayPal, mockBuyCoins, getUserTransactions } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Middleware that populates req.user if token is present, but allows request if omitted (e.g. for external testing)
const optionalProtect = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/transactions', protect, getUserTransactions);
router.post('/create', optionalProtect, createPayment);
router.post('/create-order', optionalProtect, createPayment);
router.post('/verify-razorpay', verifyRazorpay);
router.post('/verify-payment', verifyRazorpay);
router.post('/verify-paypal', protect, verifyPayPal);
router.post('/mock-buy', protect, mockBuyCoins);

module.exports = router;
