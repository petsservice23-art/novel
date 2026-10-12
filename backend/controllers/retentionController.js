const User = require('../models/User');
const Chapter = require('../models/Chapter');
const Novel = require('../models/Novel');
const { getChapterTier } = require('./chapterController');

// @desc    Claim daily login reward (5 coins)
// @route   POST /api/retention/daily-reward
// @access  Private
const claimDailyReward = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();

    if (user.last_daily_reward) {
      const last = new Date(user.last_daily_reward);
      const sameDay =
        last.getDate() === now.getDate() &&
        last.getMonth() === now.getMonth() &&
        last.getFullYear() === now.getFullYear();
      if (sameDay) {
        return res.status(400).json({ message: 'Daily reward already claimed today!' });
      }
    }

    // Streak bonus: +1 coin per 7-day streak milestone
    let bonusCoins = 0;
    const streak = user.reading_streak?.current_streak || 0;
    if (streak > 0 && streak % 7 === 0) bonusCoins = 5;

    user.coins += 5 + bonusCoins;
    user.last_daily_reward = now;
    await user.save();

    res.json({
      message: bonusCoins > 0 ? `Daily reward! +5 coins + ${bonusCoins} streak bonus!` : 'Daily reward claimed! +5 coins.',
      coins: user.coins,
      bonusCoins
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Claim daily unlock ticket (1 ticket)
// @route   POST /api/retention/daily-ticket
// @access  Private
const claimDailyTicket = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();

    if (user.last_ticket_claim) {
      const last = new Date(user.last_ticket_claim);
      const sameDay =
        last.getDate() === now.getDate() &&
        last.getMonth() === now.getMonth() &&
        last.getFullYear() === now.getFullYear();
      if (sameDay) {
        return res.status(400).json({ message: 'Daily ticket already claimed today!' });
      }
    }

    user.unlock_tickets += 1;
    user.last_ticket_claim = now;
    await user.save();

    res.json({
      message: 'Daily ticket claimed! You can unlock 1 chapter for free.',
      tickets: user.unlock_tickets
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Unlock a chapter via simulated ad watch
// @route   POST /api/retention/ad-unlock/:chapterId
// @access  Private
const adUnlockChapter = async (req, res) => {
  try {
    let chapterId = req.params.chapterId;
    let chapter;

    if (chapterId.startsWith('dynamic_')) {
      const parts = chapterId.split('_');
      const novelId = parts[1];
      const chapterNum = Number(parts[2]);

      const novel = await Novel.findById(novelId);
      if (!novel) return res.status(404).json({ message: 'Novel not found' });

      chapter = await Chapter.findOne({ novel_id: novelId, chapter_number: chapterNum });

      if (!chapter) {
        const isLocked = chapterNum > 3;
        chapter = new Chapter({
          novel_id: novelId,
          chapter_number: chapterNum,
          title: `Chapter ${chapterNum}: The Journey Unfolds`,
          content: [
            `As the sun rose high over the empire, the events of the previous days began to settle.`,
            `This is Chapter ${chapterNum} of the grand epic "${novel.title}".`,
            `With each page turned, the mystery deepens and the destiny of the characters unfolds further.`,
            `“There is no turning back now,” a soft whisper echoed through the silent corridor. The truth was close, yet so far.`
          ],
          is_locked: isLocked,
          price: isLocked ? 10 : 0
        });
        await chapter.save();
      }
    } else {
      chapter = await Chapter.findById(chapterId);
    }

    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

    const novel = await Novel.findById(chapter.novel_id);
    const tier = getChapterTier(chapter.chapter_number, novel.total_chapters);

    if (tier !== 'ad') {
      return res.status(403).json({ message: 'This chapter cannot be unlocked via ads. Use coins or a ticket.' });
    }

    const user = await User.findById(req.user._id);

    // Reset daily ad counter if it's a new day
    const now = new Date();
    if (user.last_ad_unlock_reset) {
      const last = new Date(user.last_ad_unlock_reset);
      const isNewDay =
        last.getDate() !== now.getDate() ||
        last.getMonth() !== now.getMonth() ||
        last.getFullYear() !== now.getFullYear();
      if (isNewDay) {
        user.ad_unlocks_today = 0;
        user.last_ad_unlock_reset = now;
      }
    } else {
      user.last_ad_unlock_reset = now;
    }

    // Limit to 5 ad unlocks per day
    if (user.ad_unlocks_today >= 5) {
      return res.status(429).json({ message: 'Daily ad unlock limit reached (5/day). Come back tomorrow!' });
    }

    if (user.ad_unlocked_chapters.map(id => id.toString()).includes(chapter._id.toString())) {
      return res.status(400).json({ message: 'Chapter already unlocked' });
    }

    user.ad_unlocked_chapters.push(chapter._id);
    user.ad_unlocks_today += 1;
    await user.save();

    res.json({ message: 'Ad watched! Chapter unlocked.', adUnlocksToday: user.ad_unlocks_today });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get personalized recommendations
// @route   GET /api/retention/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('reading_history.novel_id');

    // Extract genres from reading history
    const genreCounts = {};
    for (const item of user.reading_history) {
      const novel = item.novel_id;
      if (novel && novel.genres) {
        for (const genre of novel.genres) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      }
    }

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    // Exclude novels already in library or history
    const readNovelIds = user.reading_history.map(h => h.novel_id?._id?.toString()).filter(Boolean);
    const libraryIds = user.library.map(id => id.toString());
    const excludeIds = [...new Set([...readNovelIds, ...libraryIds])];

    let recommendations;
    if (topGenres.length > 0) {
      recommendations = await Novel.find({
        genres: { $in: topGenres },
        _id: { $nin: excludeIds },
        status: 'approved'
      }).limit(12).sort({ rating: -1 });
    } else {
      // New user: return top-rated novels
      recommendations = await Novel.find({ status: 'approved' }).limit(12).sort({ rating: -1 });
    }

    res.json({ recommendations, basedOn: topGenres });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update reading history when user reads a chapter
// @route   POST /api/retention/track-read
// @access  Private
const trackRead = async (req, res) => {
  try {
    const { novelId, chapterNumber } = req.body;
    const user = await User.findById(req.user._id);

    // Update reading history
    const existingIdx = user.reading_history.findIndex(
      h => h.novel_id?.toString() === novelId
    );

    if (existingIdx >= 0) {
      user.reading_history[existingIdx].last_chapter_read = chapterNumber;
      user.reading_history[existingIdx].updated_at = new Date();
    } else {
      user.reading_history.push({ novel_id: novelId, last_chapter_read: chapterNumber });
    }

    // Update reading streak
    const now = new Date();
    const lastRead = user.reading_streak?.last_read_date;
    if (lastRead) {
      const diffMs = now - new Date(lastRead);
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.reading_streak.current_streak += 1;
        if (user.reading_streak.current_streak > user.reading_streak.longest_streak) {
          user.reading_streak.longest_streak = user.reading_streak.current_streak;
        }
      } else if (diffDays > 1) {
        user.reading_streak.current_streak = 1;
      }
    } else {
      user.reading_streak.current_streak = 1;
      user.reading_streak.longest_streak = 1;
    }
    user.reading_streak.last_read_date = now;

    await user.save();

    res.json({
      streak: user.reading_streak,
      readingHistory: user.reading_history
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { claimDailyReward, claimDailyTicket, adUnlockChapter, getRecommendations, trackRead };
