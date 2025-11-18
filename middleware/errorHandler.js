const { logger } = require('../config/logger');

// ===== CUSTOM ERROR CLASS =====
// Why? Distinguish operational errors (user mistakes) from programming bugs
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Mark as expected error
    Error.captureStackTrace(this, this.constructor);
  }
}

// ===== GLOBAL ERROR HANDLER =====
// Why? Centralized error response + logging. Must be LAST middleware.
const errorHandler = (err, req, res, next) => {
  // Set defaults
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // ===== LOG ERROR =====
  // Why? Track all errors for debugging and monitoring
  const logData = {
    message: err.message,
    statusCode: err.statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (err.statusCode >= 500) {
    logger.error(JSON.stringify({
      ...logData,
      stack: err.stack
    }));
  } else {
    logger.warn(JSON.stringify(logData));
  }

  // ===== SEND RESPONSE =====
  // Why? Never expose stack traces in production (security risk)
  const response = {
    success: false,
    message: err.message,
    statusCode: err.statusCode
  };

  // Include stack only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(err.statusCode).json(response);
};

// ===== ASYNC ERROR WRAPPER =====
// Why? Eliminates try-catch in every async route
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, asyncHandler };
