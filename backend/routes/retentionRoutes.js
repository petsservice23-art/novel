const express = require('express');
const router = express.Router();
const {
  claimDailyReward,
  claimDailyTicket,
  adUnlockChapter,
  getRecommendations,
  trackRead
} = require('../controllers/retentionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/daily-reward', protect, claimDailyReward);
router.post('/daily-ticket', protect, claimDailyTicket);
router.post('/ad-unlock/:chapterId', protect, adUnlockChapter);
router.get('/recommendations', protect, getRecommendations);
router.post('/track-read', protect, trackRead);

module.exports = router;
