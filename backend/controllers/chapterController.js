const Chapter = require('../models/Chapter');
const Novel = require('../models/Novel');
const User = require('../models/User');

// Helper: Determine chapter tier based on novel length and chapter number
const getChapterTier = (chapterNum, totalChapters) => {
  let freeLimit, adLimit;

  if (totalChapters <= 140) {
    // Short Novels (80–140)
    freeLimit = 50;
    adLimit = 50 + 20; // 70
  } else if (totalChapters <= 220) {
    // Medium Novels (140–220)
    freeLimit = 70;
    adLimit = 70 + 30; // 100
  } else {
    // Long Novels (220–400)
    freeLimit = 100;
    adLimit = 100 + 40; // 140
  }

  if (chapterNum <= freeLimit) return 'free';
  if (chapterNum <= adLimit) return 'ad';
  return 'paid';
};

// @desc    Get chapters for a novel (list, no content)
// @route   GET /api/chapters/novel/:novelId
// @access  Public
const getChaptersByNovel = async (req, res) => {
  try {
    const novel = await Novel.findById(req.params.novelId);
    if (!novel) return res.status(404).json({ message: 'Novel not found' });

    const chapters = await Chapter.find({ novel_id: req.params.novelId })
      .select('-content')
      .sort({ chapter_number: 1 });

    const existingNumbers = chapters.map(c => c.chapter_number);
    const fullList = [...chapters.map(ch => ch.toObject())];

    for (let i = 1; i <= novel.total_chapters; i++) {
      if (!existingNumbers.includes(i)) {
        fullList.push({
          _id: `dynamic_${novel._id}_${i}`,
          novel_id: novel._id,
          chapter_number: i,
          title: `Chapter ${i}: The Journey Unfolds`,
          is_locked: i > 3,
          price: i > 3 ? 10 : 0,
          createdAt: novel.createdAt,
          updatedAt: novel.updatedAt
        });
      }
    }

    fullList.sort((a, b) => a.chapter_number - b.chapter_number);

    // Annotate each chapter with its tier
    const annotated = fullList.map(ch => ({
      ...ch,
      tier: getChapterTier(ch.chapter_number, novel.total_chapters)
    }));

    res.json(annotated);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Novel not found' });
    }
    console.error("getChaptersByNovel Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper: Check if user has access to a chapter
const checkUserAccess = async (user, chapter, tier) => {
  if (!user) return false;
  if (['author', 'admin'].includes(user.role)) return true;
  if (user.is_vip && tier === 'vip') return true;

  const chapterId = chapter._id.toString();
  const unlockedById = user.unlocked_chapters.map(id => id.toString());
  const adUnlockedById = user.ad_unlocked_chapters.map(id => id.toString());

  return unlockedById.includes(chapterId) || adUnlockedById.includes(chapterId);
};

// @desc    Get single chapter content by ID
// @route   GET /api/chapters/:id
// @access  Tiered
const getChapterById = async (req, res) => {
  try {
    let chapterId = req.params.id;
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

    if (tier === 'free') return res.json({ ...chapter.toObject(), tier });

    const reqUser = req.user ? await User.findById(req.user._id) : null;

    if (reqUser && ['author', 'admin'].includes(reqUser.role)) {
      return res.json({ ...chapter.toObject(), tier });
    }

    const hasAccess = await checkUserAccess(reqUser, chapter, tier);
    if (hasAccess) return res.json({ ...chapter.toObject(), tier });

    // Return locked response with tier info for UI
    return res.status(403).json({
      message: 'Chapter is locked',
      tier,
      price: tier === 'paid' || tier === 'vip' ? 10 : 0,
      userTickets: reqUser?.unlock_tickets || 0,
      chapterId: chapter._id
    });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Chapter not found' });
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get chapter by novel ID and chapter number
// @route   GET /api/chapters/novel/:novelId/chapter/:chapterNumber
// @access  Tiered
const getChapterByNumber = async (req, res) => {
  try {
    const novelId = req.params.novelId;
    const chapterNum = Number(req.params.chapterNumber);
    const novel = await Novel.findById(novelId);
    if (!novel) return res.status(404).json({ message: 'Novel not found' });

    if (chapterNum < 1 || chapterNum > novel.total_chapters) {
      return res.status(404).json({ message: 'Chapter not found' });
    }

    let chapter = await Chapter.findOne({ novel_id: novelId, chapter_number: chapterNum });

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

    const tier = getChapterTier(chapter.chapter_number, novel.total_chapters);

    if (tier === 'free') return res.json({ ...chapter.toObject(), tier });

    const reqUser = req.user ? await User.findById(req.user._id) : null;

    if (reqUser && ['author', 'admin'].includes(reqUser.role)) {
      return res.json({ ...chapter.toObject(), tier });
    }

    const hasAccess = await checkUserAccess(reqUser, chapter, tier);
    if (hasAccess) return res.json({ ...chapter.toObject(), tier });

    return res.status(403).json({
      message: 'Chapter is locked',
      tier,
      price: tier === 'paid' || tier === 'vip' ? 10 : 0,
      userTickets: reqUser?.unlock_tickets || 0,
      chapterId: chapter._id,
      // "1 chapter left" psychology nudge
      isNearUnlock: chapter.chapter_number > 0 && (tier === 'paid' || tier === 'ad')
    });
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Chapter not found' });
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Unlock a chapter with coins
// @route   POST /api/chapters/:id/unlock
// @access  Private
const unlockChapter = async (req, res) => {
  try {
    let chapterId = req.params.id;
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

    const user = await User.findById(req.user._id);

    if (user.unlocked_chapters.map(id => id.toString()).includes(chapter._id.toString())) {
      return res.status(400).json({ message: 'Chapter already unlocked' });
    }

    const novel = await Novel.findById(chapter.novel_id);
    const tier = getChapterTier(chapter.chapter_number, novel.total_chapters);
    const price = 10;

    if (user.coins < price) {
      return res.status(400).json({ message: 'Insufficient coins', coins: user.coins });
    }

    user.coins -= price;
    user.unlocked_chapters.push(chapter._id);
    await user.save();

    res.json({ message: 'Chapter unlocked!', coins: user.coins, tier });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Use a ticket to unlock a chapter
// @route   POST /api/chapters/:id/ticket-unlock
// @access  Private
const ticketUnlockChapter = async (req, res) => {
  try {
    let chapterId = req.params.id;
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

    const user = await User.findById(req.user._id);

    if (user.unlocked_chapters.map(id => id.toString()).includes(chapter._id.toString())) {
      return res.status(400).json({ message: 'Chapter already unlocked' });
    }

    if (user.unlock_tickets < 1) {
      return res.status(400).json({ message: 'No unlock tickets remaining' });
    }

    const novel = await Novel.findById(chapter.novel_id);
    const tier = getChapterTier(chapter.chapter_number, novel.total_chapters);

    if (tier === 'vip') {
      return res.status(403).json({ message: 'Tickets cannot be used on VIP chapters. Use coins.' });
    }

    user.unlock_tickets -= 1;
    user.unlocked_chapters.push(chapter._id);
    await user.save();

    res.json({ message: 'Chapter unlocked with ticket!', tickets: user.unlock_tickets });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a new chapter
// @route   POST /api/chapters
// @access  Private/Author
const addChapter = async (req, res) => {
  const { novel_id, chapter_number, title, content, is_locked, price } = req.body;

  const novel = await Novel.findById(novel_id);
  if (!novel) return res.status(404).json({ message: 'Novel not found' });

  if (novel.author_id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to add chapter to this novel' });
  }

  const chapter = await Chapter.create({
    novel_id,
    chapter_number,
    title,
    content,
    is_locked,
    price
  });

  // Re-calculate total chapters
  const total = await Chapter.countDocuments({ novel_id });
  novel.total_chapters = total;
  await novel.save();

  res.status(201).json(chapter);
};

module.exports = {
  getChaptersByNovel,
  getChapterById,
  addChapter,
  getChapterByNumber,
  unlockChapter,
  ticketUnlockChapter,
  getChapterTier
};
