const jwt = require('jsonwebtoken');

const generateToken = (res, userId, rememberMe = true) => {
  const expiresIn = rememberMe ? '30d' : '1d';
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn,
  });

  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = rememberMe ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000);

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge,
  });
};

module.exports = generateToken;
