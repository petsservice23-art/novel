const Novel = require('../models/Novel');

// @desc    Get all approved novels
// @route   GET /api/novels
// @access  Public
const getNovels = async (req, res) => {
  try {
    const novels = await Novel.find().populate('author_id', 'username').sort({ createdAt: -1 });
    res.json(novels);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch novels' });
  }
};

// @desc    Get novel by ID
// @route   GET /api/novels/:id
// @access  Public
const getNovelById = async (req, res) => {
  try {
    const novel = await Novel.findById(req.params.id).populate('author_id', 'username avatar');
    if (novel) {
      // Increment views
      novel.views += 1;
      await novel.save();
      res.json(novel);
    } else {
      res.status(404).json({ message: 'Novel not found' });
    }
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Novel not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a novel
// @route   POST /api/novels
// @access  Private/Author
const createNovel = async (req, res) => {
  const { title, description, cover_image, genres, tags } = req.body;

  const novel = new Novel({
    title,
    description,
    cover_image,
    genres,
    tags,
    author_id: req.user._id,
    status: 'pending' // Admin must approve
  });

  const createdNovel = await novel.save();
  res.status(201).json(createdNovel);
};

// @desc    Update a novel
// @route   PUT /api/novels/:id
// @access  Private/Author
const updateNovel = async (req, res) => {
  const { title, description, cover_image, genres, tags } = req.body;

  const novel = await Novel.findById(req.params.id);

  if (novel) {
    // Check if the user is the author
    if (novel.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to update this novel' });
    }

    novel.title = title || novel.title;
    novel.description = description || novel.description;
    novel.cover_image = cover_image || novel.cover_image;
    novel.genres = genres || novel.genres;
    novel.tags = tags || novel.tags;

    const updatedNovel = await novel.save();
    res.json(updatedNovel);
  } else {
    res.status(404).json({ message: 'Novel not found' });
  }
};

// @desc    Search novels by text, genre, tags
// @route   GET /api/novels/search
// @access  Public
const searchNovels = async (req, res) => {
  const { q, genre, status, sort } = req.query;
  const pageSize = 20;
  const page = Number(req.query.page) || 1;

  let dbQuery = {};

  if (q) {
    dbQuery.$or = [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  if (genre && genre !== 'All') {
    dbQuery.genres = { $in: [genre] };
  }

  if (status && status !== 'All') {
    dbQuery.status = status;
  }

  let sortOption = { createdAt: -1 }; // Latest default
  if (sort === 'Popular') sortOption = { views: -1 };
  if (sort === 'Rating') sortOption = { rating: -1 };

  try {
    const novels = await Novel.find(dbQuery)
      .sort(sortOption)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json(novels);
  } catch (error) {
    res.status(500).json({ message: 'Search failed' });
  }
};

// @desc    Get recommendations for a user
// @route   GET /api/novels/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
  const user = await req.user.populate('library');
  
  // Basic recommendation logic: 
  // 1. Gather all genres the user has in their library.
  let favoriteGenres = [];
  if (user.library && user.library.length > 0) {
    user.library.forEach(novel => {
      if (novel.genres) favoriteGenres.push(...novel.genres);
    });
  }

  // Fallback if no library: just get popular novels
  if (favoriteGenres.length === 0) {
    const popular = await Novel.find({ status: 'approved' }).sort({ views: -1 }).limit(10);
    return res.json({ type: 'popular', novels: popular });
  }

  // Get most frequent genres
  const genreCounts = favoriteGenres.reduce((acc, g) => {
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const topGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]).slice(0, 3);

  // Find other novels in those genres not in user's library
  const libraryIds = user.library.map(n => n._id);
  const recommendations = await Novel.find({
    status: 'approved',
    _id: { $nin: libraryIds },
    genres: { $in: topGenres }
  }).sort({ rating: -1 }).limit(10);

  res.json({ type: 'personalized', genres: topGenres, novels: recommendations });
};

module.exports = { getNovels, getNovelById, createNovel, updateNovel, searchNovels, getRecommendations };
