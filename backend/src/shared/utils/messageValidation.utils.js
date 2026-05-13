/**
 * Message Validation & Sanitization Utilities
 * Addresses Issue 2: Missing Input Validation - Message Content Injection
 */

const xss = require('xss');

/**
 * Sanitize message content to prevent XSS attacks
 * - Removes HTML/script tags
 * - Removes control characters
 * - Validates UTF-8 encoding
 * - Preserves safe formatting (newlines, spaces)
 */
const sanitizeMessage = (content) => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Step 1: Remove control characters (except newline, tab, carriage return)
  let sanitized = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Step 2: Validate UTF-8 encoding
  try {
    // Check if string can be encoded/decoded as UTF-8
    Buffer.from(sanitized, 'utf8').toString('utf8');
  } catch (error) {
    // If invalid UTF-8, replace with empty string
    sanitized = '';
  }

  // Step 3: Remove all HTML tags (aggressive approach)
  // This removes any content between < and >
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Step 4: Use XSS library as additional layer
  // Whitelist: only allow basic text formatting (no tags)
  sanitized = xss(sanitized, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoredTag: true,
    stripComment: true,
    onTagAttr: () => '', // Remove all attributes
  });

  // Step 5: Remove any remaining HTML entities that could be malicious
  sanitized = sanitized
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');

  // Step 6: Trim and normalize whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

/**
 * Validate message content for security and format issues
 * Returns { valid: boolean, error?: string }
 */
const validateMessageContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Message content must be a non-empty string' };
  }

  const trimmed = content.trim();

  // Check minimum length
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  // Check maximum length
  if (trimmed.length > 2000) {
    return { valid: false, error: 'Message exceeds maximum length of 2000 characters' };
  }

  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b)/i,
    /(-{2}|\/\*|\*\/|;)/,
    /(xp_|sp_|0x)/i,
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Message contains invalid characters or patterns' };
    }
  }

  // Check for malicious URLs
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = trimmed.match(urlPattern) || [];

  for (const url of urls) {
    if (!isValidUrl(url)) {
      return { valid: false, error: 'Message contains invalid URL' };
    }
  }

  // Check for excessive special characters (potential spam/obfuscation)
  const specialCharCount = (trimmed.match(/[!@#$%^&*()_+=\[\]{};:'",.<>?/\\|`~]/g) || []).length;
  if (specialCharCount > trimmed.length * 0.5) {
    return { valid: false, error: 'Message contains too many special characters' };
  }

  return { valid: true };
};

/**
 * Validate URL format and protocol
 */
const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    // Check for suspicious domains
    const hostname = url.hostname.toLowerCase();
    if (hostname.includes('javascript:') || hostname.includes('data:')) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate receiver ID format
 */
const validateReceiverId = (receiverId) => {
  if (!receiverId || typeof receiverId !== 'string') {
    return { valid: false, error: 'Receiver ID must be a non-empty string' };
  }

  // Check if it's a valid MongoDB ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(receiverId)) {
    return { valid: false, error: 'Invalid receiver ID format' };
  }

  return { valid: true };
};

/**
 * Validate product reference ID format
 */
const validateProductRef = (productRef) => {
  if (!productRef) {
    return { valid: true }; // Optional field
  }

  if (typeof productRef !== 'string') {
    return { valid: false, error: 'Product reference must be a string' };
  }

  // Check if it's a valid MongoDB ObjectId format
  if (!/^[0-9a-fA-F]{24}$/.test(productRef)) {
    return { valid: false, error: 'Invalid product reference format' };
  }

  return { valid: true };
};

/**
 * Comprehensive message validation
 * Validates all fields and returns sanitized content
 */
const validateAndSanitizeMessage = (data) => {
  const { content, receiver, productRef } = data || {};

  // Validate receiver
  const receiverValidation = validateReceiverId(receiver);
  if (!receiverValidation.valid) {
    return { valid: false, error: receiverValidation.error };
  }

  // Validate product ref if provided
  if (productRef) {
    const productValidation = validateProductRef(productRef);
    if (!productValidation.valid) {
      return { valid: false, error: productValidation.error };
    }
  }

  // Validate content
  const contentValidation = validateMessageContent(content);
  if (!contentValidation.valid) {
    return { valid: false, error: contentValidation.error };
  }

  // Sanitize content
  const sanitized = sanitizeMessage(content);

  return {
    valid: true,
    data: {
      content: sanitized,
      receiver,
      productRef: productRef || null,
    },
  };
};

module.exports = {
  sanitizeMessage,
  validateMessageContent,
  validateReceiverId,
  validateProductRef,
  validateAndSanitizeMessage,
  isValidUrl,
};
