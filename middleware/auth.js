const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const { logger } = require('../config/logger');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('No token provided. Please login.', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AppError('Invalid token format. Use: Bearer TOKEN', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-hashedPassword -refreshToken');
    
    if (!user) {
      throw new AppError('User not found.', 401);
    }

    // Log successful authentication (for security audits)
    logger.info(JSON.stringify({
      message: 'User authenticated',
      userId: user._id,
      email: user.email,
      ip: req.ip,
      url: req.originalUrl
    }));

    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh.', 401));
    }
    
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }

    next(error);
  }
};

module.exports = { authenticateToken };
