const express = require('express');
const router = express.Router();
const {
  getChaptersByNovel,
  getChapterById,
  addChapter,
  getChapterByNumber,
  unlockChapter,
  ticketUnlockChapter
} = require('../controllers/chapterController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Optional auth middleware - attaches user if logged in but doesn't block if not
const optionalAuth = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  let token;
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    } catch (err) {
      // Token invalid, continue as guest
    }
  }
  next();
};

router.route('/')
  .post(protect, authorize('author', 'admin'), addChapter);

router.get('/novel/:novelId', getChaptersByNovel);
router.get('/novel/:novelId/chapter/:chapterNumber', optionalAuth, getChapterByNumber);
router.get('/:id', optionalAuth, getChapterById);
router.post('/:id/unlock', protect, unlockChapter);
router.post('/:id/ticket-unlock', protect, ticketUnlockChapter);

module.exports = router;
