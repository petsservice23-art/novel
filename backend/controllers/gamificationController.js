const User = require('../models/User');

// @desc    Update reading streak and award XP
// @route   POST /api/gamification/read
// @access  Private
const updateReadingStreak = async (req, res) => {
  const user = await User.findById(req.user._id);

  const now = new Date();
  const lastRead = user.reading_streak.last_read_date;

  // Determine if streak continues, breaks, or increments
  if (!lastRead) {
    user.reading_streak.current_streak = 1;
    user.reading_streak.longest_streak = 1;
  } else {
    const diffTime = Math.abs(now - lastRead);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 1) {
      // Consecutive day
      user.reading_streak.current_streak += 1;
      if (user.reading_streak.current_streak > user.reading_streak.longest_streak) {
        user.reading_streak.longest_streak = user.reading_streak.current_streak;
      }
    } else if (diffDays > 1) {
      // Streak broken
      user.reading_streak.current_streak = 1;
    }
  }

  user.reading_streak.last_read_date = now;
  user.xp += 10; // Award 10 XP per chapter read action

  // Badge Logic Example
  if (user.xp >= 100 && !user.badges.includes('Novice Reader')) {
    user.badges.push('Novice Reader');
  }

  await user.save();
  res.json({ streak: user.reading_streak, xp: user.xp, badges: user.badges });
};

// @desc    Claim daily reward
// @route   POST /api/gamification/daily-reward
// @access  Private
const claimDailyReward = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    
    // Check if claimed today
    if (user.last_daily_reward) {
      const lastClaim = new Date(user.last_daily_reward);
      if (
        lastClaim.getDate() === now.getDate() &&
        lastClaim.getMonth() === now.getMonth() &&
        lastClaim.getFullYear() === now.getFullYear()
      ) {
        return res.status(400).json({ message: 'Daily reward already claimed today.' });
      }
    }

    user.coins += 5; // Reward amount
    user.last_daily_reward = now;
    await user.save();

    res.json({ message: 'Daily reward claimed! +5 coins.', coins: user.coins });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { updateReadingStreak, claimDailyReward };
