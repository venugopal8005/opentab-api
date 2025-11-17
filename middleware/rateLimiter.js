const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logger');

// ===== CUSTOM RATE LIMIT HANDLER =====
// Why? Log rate limit violations for security monitoring
const rateLimitHandler = (req, res) => {
  logger.warn(JSON.stringify({
    message: 'Rate limit exceeded',
    ip: req.ip,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  }));

  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: req.rateLimit.resetTime
  });
};

// ===== GENERAL API LIMITER =====
// Why? Protect all endpoints from spam (100 requests per 15 min)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  handler: rateLimitHandler,
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => {
    // Skip for health checks or monitoring
    return req.path === '/health' || req.path === '/';
  }
});

// ===== AUTH LIMITER (STRICTER) =====
// Why? Prevent brute-force login attacks (5 attempts per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false
});

// ===== REGISTRATION LIMITER =====
// Why? Prevent spam account creation (3 per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 6,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, registerLimiter };
