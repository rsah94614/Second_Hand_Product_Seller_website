/**
 * CSRF Protection Middleware
 * Implements CSRF token generation and validation
 */

const crypto = require('crypto');

// Store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map();

// Token expiry time (1 hour)
const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Generate CSRF token
 */
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware to generate and attach CSRF token to response
 */
const attachCsrfToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Generate token if not exists
  if (!req.session?.csrfToken) {
    const token = generateCsrfToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
    
    // Store token with expiry
    csrfTokens.set(token, { expiresAt, userId: req.user?._id });
    
    // Attach to session (if using express-session)
    if (req.session) {
      req.session.csrfToken = token;
    }
    
    // Attach to response header
    res.setHeader('X-CSRF-Token', token);
  }

  next();
};

/**
 * Middleware to validate CSRF token
 */
const validateCsrfToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF in development if disabled
  if (process.env.NODE_ENV !== 'production' && process.env.CSRF_ENABLED === 'false') {
    console.warn('[DEV WARNING] CSRF protection is disabled');
    return next();
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] || req.body?._csrf;

  if (!token) {
    return res.status(403).json({ 
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // Validate token
  const tokenData = csrfTokens.get(token);
  
  if (!tokenData) {
    return res.status(403).json({ 
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  // Check if token expired
  if (Date.now() > tokenData.expiresAt) {
    csrfTokens.delete(token);
    return res.status(403).json({ 
      message: 'CSRF token expired',
      code: 'CSRF_TOKEN_EXPIRED'
    });
  }

  // Token is valid, proceed
  next();
};

/**
 * Cleanup expired tokens periodically
 */
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(token);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

/**
 * Get CSRF token endpoint
 */
const getCsrfToken = (req, res) => {
  const token = generateCsrfToken();
  const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
  
  csrfTokens.set(token, { expiresAt, userId: req.user?._id });
  
  res.json({ 
    csrfToken: token,
    expiresIn: TOKEN_EXPIRY_MS / 1000 // in seconds
  });
};

module.exports = {
  attachCsrfToken,
  validateCsrfToken,
  getCsrfToken,
  generateCsrfToken,
};
