const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

// Import register and login routes
const registerRoute = require('./register');
const loginRoute = require('./login');

// Mount register and login routes
router.use('/register', registerRoute);  // POST /api/auth/register
router.use('/login', loginRoute);        // POST /api/auth/login

// Helper: Generate both tokens
const generateTokens = async (user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  user.refreshToken = refreshToken;
  await user.save();
  
  return { accessToken, refreshToken };
};

// Refresh Token - Get new access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Find user and verify token matches database
    const user = await User.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh',
      error: error.message
    });
  }
});

// Logout - Clear refresh token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// PROTECTED ROUTE - Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'User profile retrieved',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
