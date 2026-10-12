const express = require('express');
const router = express.Router();
const { updateReadingStreak, claimDailyReward } = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/read', protect, updateReadingStreak);
router.post('/daily-reward', protect, claimDailyReward);

module.exports = router;
