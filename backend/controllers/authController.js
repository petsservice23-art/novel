const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token (supports Email OR Username)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, username, identifier: loginInput, password, rememberMe = true } = req.body;
  const identifier = (loginInput || email || username || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/username and password are required' });
  }

  // Find user by either email or username (case-insensitive)
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: { $regex: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
    ]
  });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id, rememberMe);
    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      coins: user.coins
    });
  } else {
    return res.status(401).json({ message: 'Invalid email/username or password' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  const userExists = await User.findOne({
    $or: [
      { email: cleanEmail },
      { username: { $regex: new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
    ]
  });

  if (userExists) {
    if (userExists.email === cleanEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    return res.status(400).json({ message: 'Username is already taken' });
  }

  const user = await User.create({ 
    username: cleanUsername, 
    email: cleanEmail, 
    password,
    coins: 100 // Welcome coins
  });

  if (user) {
    generateToken(res, user._id);
    return res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      coins: user.coins
    });
  } else {
    return res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('library', 'title cover_image')
    .populate('reading_history.novel_id', 'title cover_image');
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      coins: updatedUser.coins,
      reading_streak: updatedUser.reading_streak,
      is_vip: updatedUser.is_vip
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Toggle Novel in Library
// @route   POST /api/auth/library/:novelId
// @access  Private
const toggleLibrary = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const novelId = req.params.novelId;
  const index = user.library.indexOf(novelId);

  let isAdded = false;
  if (index === -1) {
    user.library.push(novelId);
    isAdded = true;
  } else {
    user.library.splice(index, 1);
  }

  await user.save();
  res.json({ message: isAdded ? 'Added to library' : 'Removed from library', isAdded });
};

// @desc    Authenticate with Google (Access Token, ID Token, or UserInfo)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  const { credential, accessToken, email: clientEmail, name: clientName, picture: clientPicture, sub: clientSub } = req.body;
  const clientId = process.env.GOOGLE_CLIENT_ID || '656237342191-m887mlvosfiojh461l1ke5f3a3up07k6.apps.googleusercontent.com';

  try {
    let email, name, picture, googleId;

    if (accessToken) {
      // Verify via Google UserInfo API using access token
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!googleRes.ok) {
        return res.status(401).json({ message: 'Invalid or expired Google access token' });
      }
      const data = await googleRes.json();
      email = data.email;
      name = data.name || data.given_name || 'Reader';
      picture = data.picture || '';
      googleId = data.sub;
    } else if (credential) {
      // Verify Google ID token (JWT)
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!googleRes.ok) {
        return res.status(401).json({ message: 'Invalid Google credential token' });
      }
      const data = await googleRes.json();
      email = data.email;
      name = data.name || data.given_name || 'Reader';
      picture = data.picture || '';
      googleId = data.sub;
    } else if (clientEmail && clientSub) {
      email = clientEmail;
      name = clientName || 'Reader';
      picture = clientPicture || '';
      googleId = clientSub;
    } else {
      return res.status(400).json({ message: 'Google authentication token is required' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Could not retrieve email from Google' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.avatar && picture) {
        user.avatar = picture;
        await user.save();
      }
    } else {
      // Create new user with 100 welcome coins
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'reader';
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${Math.floor(100 + Math.random() * 900)}`;
        counter++;
        if (counter > 20) break;
      }

      user = await User.create({
        username: uniqueUsername,
        email,
        password: randomPassword,
        avatar: picture,
        coins: 100 // Welcome coins
      });
    }

    // Set HTTP-only JWT Cookie
    generateToken(res, user._id);

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      coins: user.coins
    });

  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  toggleLibrary,
  googleAuth
};
