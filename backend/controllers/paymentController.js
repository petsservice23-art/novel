const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_novelverse');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_U3dZ2Mzy6PUfg7',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'IOlJEUDcb5tDK5fkyYBy7Coo',
  });
};

// Exact Package Pricing Mapping
const packages = {
  // Current Active Packages (matching frontend/src/app/coins/page.tsx)
  'Mini': { coins: 150, bonus: 10, priceUSD: 1.99, priceINR: 149 },
  'Starter': { coins: 400, bonus: 50, priceUSD: 4.99, priceINR: 499 },
  'Pro': { coins: 900, bonus: 180, priceUSD: 9.99, priceINR: 999 },
  'Elite': { coins: 2000, bonus: 600, priceUSD: 19.99, priceINR: 1999 },
  'Master': { coins: 4400, bonus: 1760, priceUSD: 39.99, priceINR: 3999 },
  'Legend': { coins: 8500, bonus: 4250, priceUSD: 69.99, priceINR: 6999 },
  // Backward compatibility for legacy package requests
  'Standard': { coins: 499, bonus: 51, priceUSD: 5.99, priceINR: 499 }
};

// PayPal Helpers
const getPayPalBaseUrl = () => {
  return (process.env.PAYPAL_MODE === 'sandbox')
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
};

const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }

  const auth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
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
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
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
    const errorData = await response.json().catch(() => ({}));
    const isRestricted = JSON.stringify(errorData).includes('PAYEE_ACCOUNT_RESTRICTED');
    if (isRestricted) {
      const customErr = new Error('PAYEE_ACCOUNT_RESTRICTED');
      customErr.userMessage = 'PayPal live payments are temporarily restricted while bank account verification completes. Please use Razorpay (Cards / UPI / NetBanking) for instant purchase.';
      customErr.code = 'PAYEE_ACCOUNT_RESTRICTED';
      throw customErr;
    }
    throw new Error(`PayPal Order creation failed: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
};

const capturePayPalOrder = async (orderId) => {
  const accessToken = await getPayPalAccessToken();
  const baseUrl = getPayPalBaseUrl();
  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
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
  const { packageName, paymentMethod = 'razorpay', currency = 'INR', amount: directAmountPaise, receipt, userId: clientUserId } = req.body;
  let user = req.user;

  // Fallback: If req.user is missing from cookie, try finding by clientUserId
  if (!user && clientUserId) {
    try {
      user = await User.findById(clientUserId);
    } catch (e) {
      console.warn('Could not find user by clientUserId:', clientUserId);
    }
  }

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
    coinsToAward = Math.floor(amountStandard);
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
        receipt: receipt || `rcpt_${user ? user._id : 'guest'}_${Date.now()}`,
        notes: { 
          userId: user ? user._id.toString() : (clientUserId || ''), 
          packageName: packageName || 'Custom', 
          coins: coinsToAward.toString() 
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
      const approveLink = order.links && order.links.find(l => l.rel === 'approve');
      paymentData.approvalUrl = approveLink ? approveLink.href : `https://www.paypal.com/checkoutnow?token=${order.id}`;
      payment_id = order.id;
    } else {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Record pending transaction if user is identified
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
      razorpayKeyId: paymentMethod === 'razorpay' ? (process.env.RAZORPAY_KEY_ID || 'rzp_live_U3dZ2Mzy6PUfg7') : undefined,
      paypalClientId: paymentMethod === 'paypal' ? process.env.PAYPAL_CLIENT_ID : undefined
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    if (error.userMessage) {
      return res.status(400).json({ message: error.userMessage, code: error.code });
    }
    res.status(500).json({ message: 'Payment provider error: ' + error.message, error: error.message });
  }
};

// @desc    Verify Razorpay Payment & Credit Coins
// @route   POST /api/payments/verify-razorpay OR /api/verify-payment
// @access  Public / Private
const verifyRazorpay = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId, userId: clientUserId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required' 
    });
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'IOlJEUDcb5tDK5fkyYBy7Coo';
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

    // Cryptographic signature is valid!
    // 1. Try finding an existing pending transaction
    let transaction = null;
    if (transactionId) {
      transaction = await Transaction.findById(transactionId);
    }
    if (!transaction) {
      transaction = await Transaction.findOne({ payment_id: razorpay_order_id });
    }

    // 2. Fetch order details directly from Razorpay to recover notes and amount if needed
    let rzpOrder = null;
    try {
      const rzpInstance = getRazorpayInstance();
      rzpOrder = await rzpInstance.orders.fetch(razorpay_order_id);
    } catch (fetchErr) {
      console.warn('Could not fetch Razorpay order details:', fetchErr.message);
    }

    // 3. Resolve target user ID
    const targetUserId = transaction?.user_id 
      || rzpOrder?.notes?.userId 
      || req.user?._id 
      || clientUserId;

    // 4. Resolve coins to award
    let coinsToAward = transaction?.coins_awarded;
    if (!coinsToAward && rzpOrder?.notes?.coins) {
      coinsToAward = parseInt(rzpOrder.notes.coins, 10);
    }
    if (!coinsToAward && rzpOrder?.notes?.packageName && packages[rzpOrder.notes.packageName]) {
      const pkg = packages[rzpOrder.notes.packageName];
      coinsToAward = pkg.coins + pkg.bonus;
    }
    if (!coinsToAward) {
      // Default fallback: Starter package (450 coins)
      coinsToAward = 450;
    }

    let updatedCoins = 0;
    if (targetUserId) {
      const userToCredit = await User.findById(targetUserId);
      if (userToCredit) {
        // Credit coins to user!
        userToCredit.coins = (userToCredit.coins || 0) + coinsToAward;
        await userToCredit.save();
        updatedCoins = userToCredit.coins;

        // Save or update transaction as success
        if (!transaction) {
          transaction = await Transaction.create({
            user_id: userToCredit._id,
            amount: rzpOrder?.amount ? (rzpOrder.amount / 100) : 999,
            coins_awarded: coinsToAward,
            type: 'coins',
            payment_provider: 'razorpay',
            currency: rzpOrder?.currency || 'INR',
            status: 'success',
            payment_id: razorpay_order_id
          });
        } else {
          transaction.status = 'success';
          await transaction.save();
        }

        return res.json({ 
          success: true, 
          message: 'Payment verified and coins credited successfully!', 
          coins: updatedCoins,
          transactionId: transaction._id 
        });
      }
    }

    if (transaction) {
      transaction.status = 'success';
      await transaction.save();
    }

    return res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      coins: updatedCoins 
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ success: false, message: 'Server error during signature verification', error: error.message });
  }
};

// @desc    Verify/Capture PayPal Payment
// @route   POST /api/payments/verify-paypal
// @access  Public / Private
const verifyPayPal = async (req, res) => {
  const { orderId, transactionId, userId: clientUserId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'PayPal orderId is required' });
  }

  try {
    const captureData = await capturePayPalOrder(orderId);
    
    if (captureData.status === 'COMPLETED') {
      let transaction = null;
      if (transactionId) {
        transaction = await Transaction.findById(transactionId);
      }
      if (!transaction) {
        transaction = await Transaction.findOne({ payment_id: orderId });
      }

      const targetUserId = transaction?.user_id || req.user?._id || clientUserId;
      let coinsToAward = transaction?.coins_awarded || 450; // default Starter

      let updatedCoins = 0;
      if (targetUserId) {
        const user = await User.findById(targetUserId);
        if (user) {
          user.coins = (user.coins || 0) + coinsToAward;
          await user.save();
          updatedCoins = user.coins;

          if (!transaction) {
            transaction = await Transaction.create({
              user_id: user._id,
              amount: captureData.purchase_units?.[0]?.amount?.value || 9.99,
              coins_awarded: coinsToAward,
              type: 'coins',
              payment_provider: 'paypal',
              currency: captureData.purchase_units?.[0]?.amount?.currency_code || 'USD',
              status: 'success',
              payment_id: orderId
            });
          } else {
            transaction.status = 'success';
            await transaction.save();
          }

          return res.json({ 
            success: true, 
            message: 'PayPal payment captured and coins awarded successfully!', 
            coins: updatedCoins,
            transactionId: transaction._id 
          });
        }
      }

      if (transaction) {
        transaction.status = 'success';
        await transaction.save();
      }

      return res.json({ success: true, message: 'PayPal payment captured successfully', coins: updatedCoins });
    } else {
      if (transactionId) {
        await Transaction.findByIdAndUpdate(transactionId, { status: 'failed' });
      }
      return res.status(400).json({ success: false, message: 'PayPal payment was not completed' });
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
