/**
 * Logger Service (Phase 4)
 * Structured logging with Winston
 * - Console output in development (colorized)
 * - JSON file output in production
 */
const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = format;

const isDev = process.env.NODE_ENV !== 'production';

// Human-readable format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${stack || message}${metaStr}`;
  })
);

// JSON format for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const loggerTransports = [
  new transports.Console({
    format: isDev ? devFormat : prodFormat,
  }),
];

// Write to files in production
if (!isDev) {
  loggerTransports.push(
    new transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: prodFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: prodFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transports: loggerTransports,
  // Don't crash on unhandled exceptions — just log them
  exceptionHandlers: [
    new transports.Console({ format: isDev ? devFormat : prodFormat }),
  ],
  rejectionHandlers: [
    new transports.Console({ format: isDev ? devFormat : prodFormat }),
  ],
});

module.exports = logger;
