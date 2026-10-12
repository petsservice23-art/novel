const express = require('express');
const router = express.Router();
const { loginUser, registerUser, logoutUser, getUserProfile, updateUserProfile, toggleLibrary } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);
router.post('/library/:novelId', protect, toggleLibrary);

module.exports = router;
