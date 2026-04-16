const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';
const skipInDev = () => isDev && process.env.DISABLE_RATE_LIMIT === 'true';

// ─── General API limiter ────────────────────────────────────────────────────
// Dev: 2000 req / 15 min  (React StrictMode + hot-reload fire many calls)
// Prod: 200 req / 15 min
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

// ─── Auth limiter ───────────────────────────────────────────────────────────
// Protects /api/auth/login and /api/auth/register
// Prod: 10 attempts / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

// ─── Register / OTP limiter ─────────────────────────────────────────────────
// Stricter — 5 signups per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: { message: 'Too many account registrations from this IP. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

// ─── Listing creation limiter ────────────────────────────────────────────────
// Max 10 listing creates per user / per hour (backend safety net)
// Note: per-user enforcement is in newUser.middleware for new accounts
const listingCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 10,
  message: { message: 'You are creating listings too fast. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

// ─── Report limiter ──────────────────────────────────────────────────────────
// Max 5 reports per IP per hour to prevent report-bombing
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: { message: 'You have submitted too many reports recently. Please wait before submitting another.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

// ─── Chat initiation limiter ─────────────────────────────────────────────────
// Max 30 distinct conversations started per IP per day
const chatStartLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: isDev ? 500 : 30,
  message: { message: 'You have started too many conversations today. Try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter,
  listingCreateLimiter,
  reportLimiter,
  chatStartLimiter,
};
