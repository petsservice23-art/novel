const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Novel = require('../models/Novel');

// @desc    Get admin analytics dashboard data
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // 1. Total Users
    const totalUsers = await User.countDocuments();
    
    // 2. Total Revenue (Success transactions)
    const transactions = await Transaction.find({ status: 'success' });
    const totalRevenueUSD = transactions.reduce((acc, tx) => {
      // Normalizing all to USD for simple analytics, assuming mock conversion if needed
      let amount = tx.amount;
      if (tx.currency === 'INR') amount = amount / 80;
      if (tx.currency === 'EUR') amount = amount / 0.9;
      return acc + amount;
    }, 0);

    // 3. Most Popular Novels
    const popularNovels = await Novel.find({ status: 'approved' })
      .sort({ views: -1 })
      .limit(5)
      .select('title views rating total_chapters');

    res.json({
      totalUsers,
      totalRevenueUSD: totalRevenueUSD.toFixed(2),
      popularNovels
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

module.exports = { getAnalytics };
