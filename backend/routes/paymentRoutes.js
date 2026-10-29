const express = require('express');
const router = express.Router();
const { createPayment, verifyRazorpay, verifyPayPal, mockBuyCoins, getUserTransactions } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/transactions', protect, getUserTransactions);
router.post('/create', protect, createPayment);
router.post('/verify-razorpay', protect, verifyRazorpay);
router.post('/verify-paypal', protect, verifyPayPal);
router.post('/mock-buy', protect, mockBuyCoins);

module.exports = router;
