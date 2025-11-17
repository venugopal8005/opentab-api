const winston = require('winston');
const path = require('path');
const fs = require('fs');

// ===== STEP 1: CREATE LOGS DIRECTORY =====
// Why? Never rely on manual mkdir. Code must handle it.
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('📁 Created logs directory');
}

// ===== STEP 2: DEFINE LOG LEVELS =====
// Why? Different severity for filtering (error > warn > info > http > debug)
const levels = {
  error: 0,   // Critical failures
  warn: 1,    // Potential problems
  info: 2,    // Important events
  http: 3,    // HTTP requests
  debug: 4    // Development details
};

// ===== STEP 3: COLOR CODE FOR CONSOLE =====
// Why? Easy visual scanning in development
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// ===== STEP 4: DEFINE FORMAT =====
// Why? Structured JSON for machine parsing + human-readable for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }), // Include stack traces
  winston.format.json() // Structured JSON for ELK, Splunk, etc.
);

// ===== STEP 5: DEFINE TRANSPORTS =====
// Why? Multiple destinations - console for dev, files for production
const transports = [
  // Console - Development visibility
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'http' : 'debug'
  }),

  // Error File - Critical errors only (level 0)
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),

  // Combined File - Everything (all levels)
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// ===== STEP 6: CREATE LOGGER INSTANCE =====
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'http' : 'debug',
  levels,
  transports,
  exitOnError: false, // Don't exit on handled exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    })
  ]
});

// ===== STEP 7: CREATE MORGAN STREAM =====
// Why? Pipe Morgan HTTP logs into Winston for unified logging
const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = { logger, morganStream };
