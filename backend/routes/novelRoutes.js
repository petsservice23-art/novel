const express = require('express');
const router = express.Router();
const { getNovels, getNovelById, createNovel, updateNovel, searchNovels, getRecommendations } = require('../controllers/novelController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getNovels)
  .post(protect, authorize('author', 'admin'), createNovel);

router.get('/search', searchNovels);
router.get('/recommendations', protect, getRecommendations);

router.route('/:id')
  .get(getNovelById)
  .put(protect, authorize('author', 'admin'), updateNovel);

module.exports = router;
