const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { logger, morganStream } = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter'); // ← ADD authLimiter here
const authRoutes = require('./routes/auth');

// ===== STEP 1: ENVIRONMENT SETUP =====
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// ===== STEP 2: DATABASE CONNECTION =====
connectDB();

// ===== STEP 3: EXPRESS APP SETUP =====
const app = express();

// ===== MIDDLEWARE (ORDER CRITICAL) =====

// 1. Trust proxy (for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// 2. CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 3. Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Morgan HTTP Logging (piped to Winston)
app.use(morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
));

// 5. Rate Limiting (before routes)
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);      // ← ADD THIS LINE
app.use('/api/auth/register', authLimiter);   // ← ADD THIS LINE

// ===== ROUTES =====

// Health Check (no auth, no rate limit)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OpenTab Backend API - Production Ready',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: 'GET /health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      refresh: 'POST /api/auth/refresh',
      logout: 'POST /api/auth/logout',
      me: 'GET /api/auth/me'
    },
    features: {
      logging: 'Winston + Morgan',
      rateLimiting: 'Enabled',
      errorHandling: 'Centralized',
      security: 'JWT + Bcrypt'
    }
  });
});

// Auth Routes
app.use('/api/auth', authRoutes);
const todoRouter = require('./routes/todos.js'); // <-- NO leading slash
app.use('/api/todos', todoRouter);
// ===== ERROR HANDLING =====

// 404 Handler
app.use('*', (req, res) => {
  logger.warn(JSON.stringify({
    message: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  }));

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler (MUST BE LAST)
app.use(errorHandler);

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// ===== SERVER START =====
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 CORS: ${corsOptions.origin}`);
  logger.info(`🛡️  Rate Limiting: Enabled (API: 100/15min, Auth: 6/15min)`); // ← Updated log
  logger.info(`📝 Logging: Winston + Morgan`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;