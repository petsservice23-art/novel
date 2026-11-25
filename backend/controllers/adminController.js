const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { parseEpub, parsePdf } = require('../utils/bookParser');
const { uploadChapterContent, uploadImage } = require('../utils/r2Service');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNovels = await Novel.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    
    // Simple revenue calculation (mock for now)
    const totalCoinsPurchased = 0; 
    
    res.json({
      users: totalUsers,
      novels: totalNovels,
      chapters: totalChapters,
      revenue: totalCoinsPurchased
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all novels with basic stats
exports.getAllNovels = async (req, res) => {
  try {
    const novels = await Novel.find().sort({ createdAt: -1 });
    res.json(novels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new novel
exports.createNovel = async (req, res) => {
  try {
    const novel = new Novel(req.body);
    await novel.save();
    res.json(novel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update novel details
exports.updateNovel = async (req, res) => {
  try {
    const novel = await Novel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(novel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete novel
exports.deleteNovel = async (req, res) => {
  try {
    await Novel.findByIdAndDelete(req.params.id);
    await Chapter.deleteMany({ novel_id: req.params.id });
    res.json({ message: 'Novel and its chapters deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk import chapters from text
// @route   POST /api/admin/import-chapters
exports.bulkImportChapters = async (req, res) => {
  const { novel_id, text, delimiter } = req.body;

  if (!novel_id || !text) {
    return res.status(400).json({ message: 'Novel ID and text are required' });
  }

  try {
    const novel = await Novel.findById(novel_id);
    if (!novel) return res.status(404).json({ message: 'Novel not found' });

    // Logic to split chapters
    // Default delimiter: "Chapter X" or "\n\n\n"
    const splitRegex = delimiter ? new RegExp(delimiter, 'i') : /Chapter\s+\d+/i;
    const contents = text.split(splitRegex).filter(c => c.trim().length > 0);
    const titles = text.match(splitRegex) || [];

    const startNum = (await Chapter.countDocuments({ novel_id })) + 1;
    
    const chaptersToCreate = contents.map((content, index) => ({
      novel_id,
      title: titles[index] ? titles[index].trim() : `Chapter ${startNum + index}`,
      content: content.trim(),
      chapter_number: startNum + index,
      tier: (startNum + index) > 10 ? 'coin' : 'free',
      is_locked: (startNum + index) > 10,
      price: (startNum + index) > 10 ? 10 : 0
    }));

    const createdChapters = await Chapter.insertMany(chaptersToCreate);
    
    // Update novel total chapters & touch updatedAt
    novel.total_chapters = await Chapter.countDocuments({ novel_id });
    novel.updatedAt = new Date();
    await novel.save();

    res.json({ 
      message: `Successfully imported ${createdChapters.length} chapters`,
      count: createdChapters.length 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user details with stats & transactions
// @route   GET /api/admin/users/:id
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('library', 'title cover_image author');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({ user_id: user._id }).sort({ createdAt: -1 }).limit(20);
    const totalSpent = transactions
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      user,
      transactions,
      stats: {
        libraryCount: user.library?.length || 0,
        unlockedCount: user.unlocked_chapters?.length || 0,
        readingHistoryCount: user.reading_history?.length || 0,
        transactionsCount: transactions.length,
        totalSpent: totalSpent.toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user details (role, coins, is_vip, email, username)
// @route   PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, coins, is_vip, unlock_tickets } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username !== undefined && username.trim()) user.username = username.trim();
    if (email !== undefined && email.trim()) user.email = email.trim().toLowerCase();
    if (role !== undefined && ['user', 'author', 'admin'].includes(role)) user.role = role;
    if (coins !== undefined && !isNaN(Number(coins))) user.coins = Number(coins);
    if (is_vip !== undefined) user.is_vip = Boolean(is_vip);
    if (unlock_tickets !== undefined && !isNaN(Number(unlock_tickets))) user.unlock_tickets = Number(unlock_tickets);

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user && req.user._id && req.user._id.toString() === userId) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Parse uploaded EPUB or PDF file
// @route   POST /api/admin/parse-book
exports.parseUploadedBook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please upload an EPUB or PDF file.' });
    }

    const filename = req.file.originalname.toLowerCase();
    let parsedData = null;

    if (filename.endsWith('.epub')) {
      parsedData = await parseEpub(req.file.buffer);
    } else if (filename.endsWith('.pdf')) {
      parsedData = await parsePdf(req.file.buffer);
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Please upload a .epub or .pdf file.' });
    }

    res.json(parsedData);
  } catch (error) {
    console.error('Book parsing error:', error);
    res.status(500).json({ message: 'Failed to parse book: ' + error.message });
  }
};

// @desc    Save finalized novel and parsed chapters to database
// @route   POST /api/admin/save-parsed-book
exports.saveParsedBook = async (req, res) => {
  try {
    const { novel: novelData, chapters: chaptersData } = req.body;

    if (!novelData || !novelData.title) {
      return res.status(400).json({ message: 'Novel title and metadata are required.' });
    }
    if (!Array.isArray(chaptersData) || chaptersData.length === 0) {
      return res.status(400).json({ message: 'At least one chapter is required.' });
    }

    // 1. Create Novel document
    const novel = new Novel({
      title: novelData.title.trim(),
      author: novelData.author ? novelData.author.trim() : 'Korean Author',
      description: novelData.description || '',
      cover_image: novelData.cover_image || `https://picsum.photos/seed/${encodeURIComponent(novelData.title)}/400/600`,
      published_year: novelData.published_year || new Date().getFullYear().toString(),
      alternative_titles: novelData.alternative_titles || '',
      publishing_status: novelData.publishing_status || 'ongoing',
      genres: Array.isArray(novelData.genres) ? novelData.genres : (novelData.genres ? novelData.genres.split(',').map(g => g.trim()) : ['Fantasy']),
      tags: Array.isArray(novelData.tags) ? novelData.tags : [],
      status: 'approved',
      is_hidden: false,
      total_chapters: chaptersData.length,
      rating: 4.8,
      ratings_count: 1
    });

    // If cover is base64, upload to Cloudflare R2 for fast CDN delivery
    if (novel.cover_image && novel.cover_image.startsWith('data:image/')) {
      try {
        const matches = novel.cover_image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = contentType.includes('png') ? 'png' : 'jpg';
          const coverKey = `novels/${novel._id}/cover_${Date.now()}.${ext}`;
          const cdnUrl = await uploadImage(coverKey, buffer, contentType);
          if (cdnUrl) novel.cover_image = cdnUrl;
        }
      } catch (covErr) {
        console.warn('Cover R2 upload failed, keeping base64:', covErr.message);
      }
    }

    await novel.save();

    // 2. Parallel upload chapters to R2 in chunks of 15 (fast & prevents timeouts)
    const concurrency = 15;
    const r2Keys = new Array(chaptersData.length).fill(null);

    for (let i = 0; i < chaptersData.length; i += concurrency) {
      const slice = chaptersData.slice(i, i + concurrency);
      await Promise.all(
        slice.map(async (ch, indexInSlice) => {
          const globalIdx = i + indexInSlice;
          const chNum = ch.chapter_number || (globalIdx + 1);
          if (ch.content) {
            try {
              r2Keys[globalIdx] = await uploadChapterContent(novel._id.toString(), chNum, ch.content);
            } catch (err) {
              // Fallback: keep content in Mongo if R2 upload fails
            }
          }
        })
      );
    }

    // 3. Insert Chapter records (first 50 free, rest coin)
    const chaptersToInsert = chaptersData.map((ch, idx) => {
      const chNum = ch.chapter_number || (idx + 1);
      const isFree = chNum <= 50;
      const r2Key = r2Keys[idx];

      return {
        novel_id: novel._id,
        chapter_number: chNum,
        title: ch.title ? ch.title.trim() : `Chapter ${chNum}`,
        content: r2Key ? null : ch.content,
        r2_key: r2Key,
        tier: isFree ? 'free' : 'coin',
        is_locked: !isFree,
        price: isFree ? 0 : 10
      };
    });

    await Chapter.insertMany(chaptersToInsert);

    // Update novel total chapters & timestamp
    novel.total_chapters = chaptersToInsert.length;
    novel.updatedAt = new Date();
    await novel.save();

    res.json({
      message: `Successfully created "${novel.title}" with ${chaptersToInsert.length} chapters!`,
      novel,
      chaptersCount: chaptersToInsert.length
    });
  } catch (error) {
    console.error('Error saving parsed book:', error);
    res.status(500).json({ message: 'Failed to save book: ' + error.message });
  }
};

// @desc    Toggle novel visibility (hide/unhide)
// @route   PUT /api/admin/novel/:id/toggle-visibility
exports.toggleNovelVisibility = async (req, res) => {
  try {
    const novel = await Novel.findById(req.params.id);
    if (!novel) {
      return res.status(404).json({ message: 'Novel not found' });
    }

    novel.is_hidden = !novel.is_hidden;
    novel.status = novel.is_hidden ? 'hidden' : 'approved';
    await novel.save();

    res.json({
      message: `Novel is now ${novel.is_hidden ? 'hidden from public' : 'visible on site'}`,
      is_hidden: novel.is_hidden,
      status: novel.status,
      novel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
