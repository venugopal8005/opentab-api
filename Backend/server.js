const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express application
const app = express();

// Middleware - Process JSON requests
app.use(express.json());

// Middleware - Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic route to test server
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OpenTab Backend API is running successfully! 🎉',
    version: '1.0.0',
    endpoints: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      test: '/api/auth/test'
    }
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Error handling middleware (catches all errors)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Handle 404 (route not found)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    available: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// Get the port from environment or use 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Available routes:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/test`);
  console.log(`\n📱 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`\n🎯 Set NEXT_PUBLIC_API_URL=http://localhost:${PORT} in your Next.js .env.local`);
});
