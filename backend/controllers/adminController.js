const Novel = require('../models/Novel');
const Chapter = require('../models/Chapter');
const User = require('../models/User');

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
      is_premium: (startNum + index) > 10 // Example: lock chapters after 10
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
