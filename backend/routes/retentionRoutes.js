const express = require('express');
const router = express.Router();
const {
  claimDailyReward,
  getRecommendations,
  trackRead
} = require('../controllers/retentionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/daily-reward', protect, claimDailyReward);
router.get('/recommendations', protect, getRecommendations);
router.post('/track-read', protect, trackRead);

module.exports = router;
