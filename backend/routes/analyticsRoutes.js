const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Only Admins can access
router.get('/', protect, authorize('admin'), getAnalytics);

module.exports = router;
