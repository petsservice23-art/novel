const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_novelverse');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_U3d7RjFggggKkK',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'OtjfabDvI9ApKIOn37zg83oZ',
  });
};

// Exact Package Pricing Mapping
const packages = {
  // Current Active Packages (matching frontend/src/app/coins/page.tsx)
  'Starter': { coins: 1000, bonus: 50, priceUSD: 9.99, priceINR: 999 },
  'Pro': { coins: 2400, bonus: 360, priceUSD: 23.99, priceINR: 1399 },
  'Elite': { coins: 4200, bonus: 1050, priceUSD: 41.99, priceINR: 4199 },
  'Master': { coins: 6000, bonus: 2100, priceUSD: 59.99, priceINR: 5999 },
  'Legend': { coins: 10000, bonus: 4500, priceUSD: 99.99, priceINR: 9999 },
  // Backward compatibility for legacy package requests
  'Standard': { coins: 499, bonus: 51, priceUSD: 5.99, priceINR: 499 }
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
// @route   POST /api/payments/create OR /api/create-order
// @access  Private / Public (supports both authenticated coin purchases and standard direct orders)
const createPayment = async (req, res) => {
  const { packageName, paymentMethod = 'razorpay', currency = 'INR', amount: directAmountPaise, receipt } = req.body;
  const user = req.user;

  let amountPaise;
  let amountStandard;
  let coinsToAward = 0;
  let resolvedCurrency = (currency || 'INR').toUpperCase();

  if (packageName) {
    const pkg = packages[packageName];
    if (!pkg) {
      return res.status(400).json({ message: 'Invalid package name' });
    }
    coinsToAward = pkg.coins + pkg.bonus;
    amountStandard = resolvedCurrency === 'INR' ? pkg.priceINR : pkg.priceUSD;
    amountPaise = Math.round(amountStandard * 100);
  } else if (directAmountPaise !== undefined) {
    amountPaise = Math.round(Number(directAmountPaise));
    amountStandard = amountPaise / 100;
  } else {
    return res.status(400).json({ message: 'Either packageName or amount is required' });
  }

  // Validate minimum amount (Razorpay minimum is 100 paise = ₹1.00)
  if (!amountPaise || amountPaise < 100) {
    return res.status(400).json({ message: 'Amount must be at least 100 paise (1 INR or USD equivalent)' });
  }

  try {
    let paymentData = {};
    let payment_id;

    if (paymentMethod === 'stripe') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountPaise,
        currency: resolvedCurrency.toLowerCase(),
        metadata: { userId: user ? user._id.toString() : 'guest', packageName: packageName || 'Custom', coins: coinsToAward },
      });
      paymentData.clientSecret = paymentIntent.client_secret;
      payment_id = paymentIntent.id;
    } else if (paymentMethod === 'razorpay') {
      const options = {
        amount: amountPaise,
        currency: resolvedCurrency,
        receipt: receipt || `receipt_${user ? user._id : 'guest'}_${Date.now()}`,
        notes: { 
          userId: user ? user._id.toString() : 'guest', 
          packageName: packageName || 'Custom', 
          coins: coinsToAward 
        }
      };
      const rzpInstance = getRazorpayInstance();
      const order = await rzpInstance.orders.create(options);
      paymentData.orderId = order.id;
      paymentData.amount = order.amount;
      paymentData.currency = order.currency;
      payment_id = order.id;
    } else if (paymentMethod === 'paypal') {
      const order = await createPayPalOrder(amountStandard, resolvedCurrency, `${packageName || 'Coins'} Package`);
      paymentData.orderId = order.id;
      payment_id = order.id;
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Record pending transaction if user is authenticated
    let transaction = null;
    if (user) {
      transaction = await Transaction.create({
        user_id: user._id,
        amount: amountStandard,
        coins_awarded: coinsToAward,
        type: 'coins',
        payment_provider: paymentMethod,
        currency: resolvedCurrency,
        status: 'pending',
        payment_id
      });
    }

    res.json({ 
      order_id: paymentData.orderId || payment_id,
      amount: paymentData.amount || amountPaise,
      currency: resolvedCurrency,
      provider: paymentMethod, 
      paymentData, 
      transactionId: transaction ? transaction._id : null,
      razorpayKeyId: paymentMethod === 'razorpay' ? (process.env.RAZORPAY_KEY_ID || 'rzp_test_U3d7RjFggggKkK') : undefined,
      paypalClientId: paymentMethod === 'paypal' ? process.env.PAYPAL_CLIENT_ID : undefined
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ message: 'Payment provider error', error: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify-razorpay OR /api/verify-payment
// @access  Public / Private
const verifyRazorpay = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required' 
    });
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'OtjfabDvI9ApKIOn37zg83oZ';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      if (transactionId) {
        await Transaction.findByIdAndUpdate(transactionId, { status: 'failed' });
      } else {
        await Transaction.findOneAndUpdate({ payment_id: razorpay_order_id }, { status: 'failed' });
      }
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Payment verification failed.' });
    }

    // Signatures match!
    let transaction = null;
    if (transactionId) {
      transaction = await Transaction.findById(transactionId);
    } else {
      transaction = await Transaction.findOne({ payment_id: razorpay_order_id });
    }

    if (transaction) {
      if (transaction.status === 'pending') {
        transaction.status = 'success';
        await transaction.save();

        if (transaction.user_id) {
          const user = await User.findById(transaction.user_id);
          if (user) {
            user.coins = (user.coins || 0) + transaction.coins_awarded;
            await user.save();
            return res.json({ 
              success: true, 
              message: 'Payment verified and coins awarded', 
              coins: user.coins,
              transactionId: transaction._id 
            });
          }
        }
      }
      return res.json({ 
        success: true, 
        message: 'Payment verified and transaction confirmed', 
        transactionId: transaction._id 
      });
    }

    return res.json({ 
      success: true, 
      message: 'Payment verified successfully' 
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during signature verification', error: error.message });
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
