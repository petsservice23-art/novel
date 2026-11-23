const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

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
    
    // Update novel total chapters
    novel.total_chapters = await Chapter.countDocuments({ novel_id });
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
