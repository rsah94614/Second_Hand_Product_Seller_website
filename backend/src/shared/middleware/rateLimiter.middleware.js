const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';
const skipRateLimit = () => isTest || (isDev && process.env.DISABLE_RATE_LIMIT === 'true');

// ─── General API limiter ────────────────────────────────────────────────────
// Dev: 2000 req / 15 min  (React StrictMode + hot-reload fire many calls)
// Prod: 200 req / 15 min
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 2000 : 200,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// ─── Auth / Login limiter ───────────────────────────────────────────────────
// Stricter — 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 10,
  message: { message: 'Too many login attempts. Please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// ─── OTP limiter ────────────────────────────────────────────────────────────
// High protection — 3 OTP requests per 5 minutes
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 50 : 3,
  message: { message: 'Too many OTP requests. Please wait 5 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// ─── Register limiter ───────────────────────────────────────────────────────
// 5 signups per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: { message: 'Too many account registrations from this IP. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// ─── Per-User API Limiter ────────────────────────────────────────────────────
// Prevents authenticated users from abusing API endpoints
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 500 : 60,
  keyGenerator: (req) => req.user._id.toString(),
  message: { message: 'You are performing too many actions. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipRateLimit() || !req.user, // Only apply to auth'd users, or skip in dev/test
});

// ─── Listing creation limiter ────────────────────────────────────────────────
// Max 10 listing creates per user / per hour (backend safety net)
const listingCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 200 : 10,
  message: { message: 'You are creating listings too fast. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// ─── Report limiter ──────────────────────────────────────────────────────────
// Max 5 reports per IP per hour to prevent report-bombing
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 50 : 5,
  message: { message: 'You have submitted too many reports recently. Please wait before submitting another.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// ─── Chat initiation limiter ─────────────────────────────────────────────────
// Max 30 distinct conversations started per IP per day
const chatStartLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: isDev ? 500 : 30,
  message: { message: 'You have started too many conversations today. Try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
});

// ─── Image upload limiter (per user) ─────────────────────────────────────────
// Max 20 image uploads per user per hour (production)
// Keyed by authenticated user ID to prevent per-IP bypass via proxies
const imageUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 200 : 20,
  keyGenerator: (req) => {
    // Use authenticated user ID when available; fall back to IP (handled by express-rate-limit default)
    if (req.user) return req.user._id.toString();
    // Return undefined to let express-rate-limit use its default IP key generator
    return undefined;
  },
  message: { message: 'You have uploaded too many images recently. Please wait before uploading again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => skipRateLimit() || !req.user,
});

module.exports = {
  apiLimiter,
  loginLimiter,
  otpLimiter,
  registerLimiter,
  userLimiter,
  listingCreateLimiter,
  reportLimiter,
  chatStartLimiter,
  imageUploadLimiter,
};
