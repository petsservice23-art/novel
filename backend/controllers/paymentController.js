const Stripe = require('stripe');
const Razorpay = require('razorpay');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Exact Package Pricing Mapping
const packages = {
  'Standard': { coins: 499, bonus: 51, priceUSD: 5.99, priceINR: 499 },
  'Pro': { coins: 999, bonus: 201, priceUSD: 11.99, priceINR: 999 },
  'Elite': { coins: 1999, bonus: 601, priceUSD: 23.99, priceINR: 1999 },
  'Master': { coins: 3499, bonus: 1301, priceUSD: 41.99, priceINR: 3499 },
  'Legend': { coins: 4999, bonus: 2501, priceUSD: 59.99, priceINR: 4999 }
};

// PayPal Helpers
const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to obtain PayPal access token: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.access_token;
};

const createPayPalOrder = async (amount, currencyCode, description) => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currencyCode,
          value: amount.toFixed(2)
        },
        description
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`PayPal Order creation failed: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
};

const capturePayPalOrder = async (orderId) => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`PayPal capture failed: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
};

// @desc    Create a payment intent/order for selected payment provider
// @route   POST /api/payments/create
// @access  Private
const createPayment = async (req, res) => {
  const { packageName, paymentMethod, currency } = req.body;
  const user = req.user;

  const pkg = packages[packageName];
  if (!pkg) {
    return res.status(400).json({ message: 'Invalid package name' });
  }

  const coinsToAward = pkg.coins + pkg.bonus;
  const amount = currency === 'INR' ? pkg.priceINR : pkg.priceUSD;

  try {
    let paymentData = {};
    let payment_id;

    if (paymentMethod === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: { userId: user._id.toString(), packageName, coins: coinsToAward },
      });
      paymentData.clientSecret = paymentIntent.client_secret;
      payment_id = paymentIntent.id;
    } else if (paymentMethod === 'razorpay') {
      const options = {
        amount: Math.round(amount * 100), // Amount in paise/cents
        currency: currency,
        receipt: `receipt_${user._id}_${Date.now()}`,
        notes: { userId: user._id.toString(), packageName, coins: coinsToAward }
      };
      const order = await razorpay.orders.create(options);
      paymentData.orderId = order.id;
      payment_id = order.id;
    } else if (paymentMethod === 'paypal') {
      const order = await createPayPalOrder(amount, currency, `${packageName} Coins Package - ${pkg.coins} + ${pkg.bonus} Bonus Coins`);
      paymentData.orderId = order.id;
      payment_id = order.id;
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Record pending transaction
    const transaction = await Transaction.create({
      user_id: user._id,
      amount,
      coins_awarded: coinsToAward,
      type: 'coins',
      payment_provider: paymentMethod,
      currency,
      status: 'pending',
      payment_id
    });

    res.json({ 
      provider: paymentMethod, 
      currency, 
      amount, 
      paymentData, 
      transactionId: transaction._id,
      razorpayKeyId: paymentMethod === 'razorpay' ? process.env.RAZORPAY_KEY_ID : undefined,
      paypalClientId: paymentMethod === 'paypal' ? process.env.PAYPAL_CLIENT_ID : undefined
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Payment provider error', error: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify-razorpay
// @access  Private
const verifyRazorpay = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === razorpay_signature) {
    const transaction = await Transaction.findById(transactionId);
    if (transaction && transaction.status === 'pending') {
      transaction.status = 'success';
      await transaction.save();

      // Award coins
      const user = await User.findById(transaction.user_id);
      user.coins = (user.coins || 0) + transaction.coins_awarded;
      await user.save();

      res.json({ success: true, message: 'Payment verified and coins awarded', coins: user.coins });
    } else {
      res.status(400).json({ success: false, message: 'Invalid transaction state' });
    }
  } else {
    // Transaction failed
    await Transaction.findByIdAndUpdate(transactionId, { status: 'failed' });
    res.status(400).json({ success: false, message: 'Invalid signature' });
  }
};

// @desc    Verify/Capture PayPal Payment
// @route   POST /api/payments/verify-paypal
// @access  Private
const verifyPayPal = async (req, res) => {
  const { orderId, transactionId } = req.body;

  try {
    const captureData = await capturePayPalOrder(orderId);
    
    if (captureData.status === 'COMPLETED') {
      const transaction = await Transaction.findById(transactionId);
      if (transaction && transaction.status === 'pending') {
        transaction.status = 'success';
        await transaction.save();

        const user = await User.findById(transaction.user_id);
        user.coins = (user.coins || 0) + transaction.coins_awarded;
        await user.save();

        res.json({ success: true, message: 'PayPal payment captured successfully', coins: user.coins });
      } else {
        res.status(400).json({ success: false, message: 'Transaction already processed or not found' });
      }
    } else {
      await Transaction.findByIdAndUpdate(transactionId, { status: 'failed' });
      res.status(400).json({ success: false, message: 'PayPal payment was not completed' });
    }
  } catch (error) {
    console.error('PayPal Capture Error:', error);
    res.status(500).json({ success: false, message: 'Failed to capture PayPal payment', error: error.message });
  }
};

// @desc    Mock buying coins (For Testing)
// @route   POST /api/payments/mock-buy
// @access  Private
const mockBuyCoins = async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const user = await User.findById(req.user._id);
    user.coins = (user.coins || 0) + amount;
    await user.save();

    // Create a transaction record for mock buy as well
    await Transaction.create({
      user_id: req.user._id,
      amount: amount / 100,
      coins_awarded: amount,
      type: 'coins',
      payment_provider: 'stripe',
      currency: 'USD',
      status: 'success',
      payment_id: 'mock_' + Date.now()
    });

    res.json({ success: true, message: `Successfully purchased ${amount} coins`, coins: user.coins });
  } catch (error) {
    res.status(500).json({ message: 'Server error during mock purchase' });
  }
};

// @desc    Get user's transactions
// @route   GET /api/payments/transactions
// @access  Private
const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user_id: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPayment, verifyRazorpay, verifyPayPal, mockBuyCoins, getUserTransactions };
