/**
 * Image Validation & Security Utilities
 * Addresses Issue 3: Image Upload Security Vulnerability
 */

const fs = require('fs');
const path = require('path');
const fileType = require('file-type');

/**
 * MIME type whitelist for chat images
 * Only allow safe image formats
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * File extension whitelist
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/**
 * Maximum file size: 5MB
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Minimum file size: 1KB (prevent empty/corrupted files)
 */
const MIN_FILE_SIZE = 1024; // 1KB

/**
 * Known malicious / non-image file signatures (magic bytes).
 * These patterns detect executables, scripts, and archives disguised as images.
 *
 * Format: { name, offset, bytes (hex string) }
 */
const MALICIOUS_SIGNATURES = [
  // Windows PE executable (EXE/DLL)
  { name: 'Windows PE executable', offset: 0, bytes: '4d5a' },
  // ELF executable (Linux binary)
  { name: 'ELF executable', offset: 0, bytes: '7f454c46' },
  // ZIP archive (could contain malware; also used by DOCX/XLSX)
  { name: 'ZIP archive', offset: 0, bytes: '504b0304' },
  // RAR archive
  { name: 'RAR archive', offset: 0, bytes: '526172211a07' },
  // 7-Zip archive
  { name: '7-Zip archive', offset: 0, bytes: '377abcaf271c' },
  // PDF document
  { name: 'PDF document', offset: 0, bytes: '25504446' },
  // PHP script (<?php)
  { name: 'PHP script', offset: 0, bytes: '3c3f706870' },
  // HTML/script tag (<html or <scri)
  { name: 'HTML content', offset: 0, bytes: '3c68746d6c' },
  { name: 'Script tag', offset: 0, bytes: '3c736372697074' },
  // Java class file
  { name: 'Java class', offset: 0, bytes: 'cafebabe' },
  // Mach-O binary (macOS)
  { name: 'Mach-O binary (32-bit)', offset: 0, bytes: 'feedface' },
  { name: 'Mach-O binary (64-bit)', offset: 0, bytes: 'feedfacf' },
  { name: 'Mach-O binary (fat)', offset: 0, bytes: 'cafebabe' },
  // Shell script (#!/)
  { name: 'Shell script', offset: 0, bytes: '23212f' },
];

/**
 * Scan file buffer for known malicious signatures.
 * Returns { safe: true } or { safe: false, threat: string }
 */
const scanForMaliciousSignatures = (buffer) => {
  for (const sig of MALICIOUS_SIGNATURES) {
    const hexBytes = sig.bytes;
    const byteLength = hexBytes.length / 2;
    const slice = buffer.slice(sig.offset, sig.offset + byteLength);
    const sliceHex = slice.toString('hex');

    if (sliceHex.startsWith(hexBytes)) {
      return { safe: false, threat: sig.name };
    }
  }
  return { safe: true };
};

/**
 * Validate image file before upload
 * Checks: file exists, MIME type, file extension, file size, magic bytes, malicious signatures
 */
const validateImageFile = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: 'File not found' };
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Check file size
    if (fileSize < MIN_FILE_SIZE) {
      return { valid: false, error: 'File is too small (minimum 1KB)' };
    }

    if (fileSize > MAX_FILE_SIZE) {
      return { valid: false, error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `File extension ${ext} is not allowed` };
    }

    // Read file header (first 262 bytes is enough for magic bytes detection)
    const HEADER_SIZE = 262;
    const fd = fs.openSync(filePath, 'r');
    const headerBuffer = Buffer.alloc(HEADER_SIZE);
    const bytesRead = fs.readSync(fd, headerBuffer, 0, HEADER_SIZE, 0);
    fs.closeSync(fd);
    const header = headerBuffer.slice(0, bytesRead);

    // Scan for malicious file signatures before MIME type check
    const malwareScan = scanForMaliciousSignatures(header);
    if (!malwareScan.safe) {
      return { valid: false, error: `File rejected: detected ${malwareScan.threat}` };
    }

    // Check MIME type using file-type library (reads magic bytes)
    const type = await fileType.fromFile(filePath);

    if (!type) {
      return { valid: false, error: 'Unable to determine file type' };
    }

    if (!ALLOWED_MIME_TYPES.includes(type.mime)) {
      return { valid: false, error: `File type ${type.mime} is not allowed` };
    }

    // Additional validation: ensure extension matches MIME type
    const mimeToExt = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    };

    const validExts = mimeToExt[type.mime] || [];
    if (!validExts.includes(ext)) {
      return { valid: false, error: 'File extension does not match file type' };
    }

    return {
      valid: true,
      fileInfo: {
        mimeType: type.mime,
        extension: ext,
        size: fileSize,
      },
    };
  } catch (error) {
    return { valid: false, error: `File validation error: ${error.message}` };
  }
};

/**
 * Validate image dimensions to prevent DoS attacks
 * Checks: width and height are reasonable
 */
const validateImageDimensions = (width, height) => {
  const MAX_DIMENSION = 10000; // Max width or height
  const MIN_DIMENSION = 1;

  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return { valid: false, error: 'Invalid image dimensions' };
  }

  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    return { valid: false, error: 'Image dimensions too small' };
  }

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return { valid: false, error: 'Image dimensions too large' };
  }

  return { valid: true };
};

/**
 * Validate image metadata from Cloudinary response
 */
const validateCloudinaryResponse = (result) => {
  if (!result || !result.secure_url) {
    return { valid: false, error: 'Invalid Cloudinary response' };
  }

  // Validate URL is HTTPS
  if (!result.secure_url.startsWith('https://')) {
    return { valid: false, error: 'Image URL must be HTTPS' };
  }

  // Validate dimensions if available
  if (result.width && result.height) {
    const dimValidation = validateImageDimensions(result.width, result.height);
    if (!dimValidation.valid) {
      return dimValidation;
    }
  }

  // Validate file size
  if (result.bytes && result.bytes > MAX_FILE_SIZE) {
    return { valid: false, error: 'Uploaded image exceeds size limit' };
  }

  return { valid: true };
};

/**
 * Sanitize image caption/content
 * Prevents XSS in image descriptions
 */
const sanitizeImageCaption = (caption) => {
  if (!caption || typeof caption !== 'string') {
    return '';
  }

  // Remove HTML tags and dangerous characters
  const sanitized = caption
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"']/g, '') // Remove dangerous characters
    .trim();

  // Limit caption length
  return sanitized.substring(0, 500);
};

/**
 * Get safe image metadata for storage
 */
const getSafeImageMetadata = (cloudinaryResult) => {
  return {
    width: cloudinaryResult.width || null,
    height: cloudinaryResult.height || null,
    size: cloudinaryResult.bytes || null,
    format: cloudinaryResult.format || null,
    publicId: cloudinaryResult.public_id || null,
  };
};

module.exports = {
  validateImageFile,
  validateImageDimensions,
  validateCloudinaryResponse,
  sanitizeImageCaption,
  getSafeImageMetadata,
  scanForMaliciousSignatures,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
};
