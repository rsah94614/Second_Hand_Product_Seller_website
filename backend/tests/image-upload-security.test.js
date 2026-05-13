/**
 * Image Upload Security Tests — Task 3
 *
 * Tests for: valid images, invalid file types, oversized files, malware samples.
 * Runs with plain Node.js (no test framework required).
 *
 * Usage:  node tests/image-upload-security.test.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const {
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
} = require('../src/shared/utils/imageValidation.utils');

// ─── Test infrastructure ──────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const tempFiles = [];

const ok = (label) => {
  console.log(`  ✓ ${label}`);
  passed++;
};

const fail = (label, err) => {
  console.error(`  ✗ ${label}`);
  console.error(`    ${err && err.message ? err.message : err}`);
  failed++;
};

const test = async (label, fn) => {
  try {
    await fn();
    ok(label);
  } catch (err) {
    fail(label, err);
  }
};

const section = (title) => console.log(`\n=== ${title} ===`);

/** Write a temporary file and track it for cleanup. */
const writeTempFile = (filename, buf) => {
  const filePath = path.join(os.tmpdir(), `img-sec-test-${Date.now()}-${filename}`);
  fs.writeFileSync(filePath, buf);
  tempFiles.push(filePath);
  return filePath;
};

/** Build a Buffer of `totalSize` bytes starting with the given hex magic bytes. */
const buildFileBuffer = (magicHex, totalSize = MIN_FILE_SIZE + 100) => {
  const magic = Buffer.from(magicHex, 'hex');
  const padding = Buffer.alloc(Math.max(0, totalSize - magic.length), 0x00);
  return Buffer.concat([magic, padding]);
};

// Magic byte constants
const JPEG_MAGIC = 'ffd8ffe0';
const PNG_MAGIC  = '89504e470d0a1a0a';
const GIF_MAGIC  = '474946383961'; // GIF89a

// ─── Tests ────────────────────────────────────────────────────────────────────

(async () => {

  // ── 1. Constants ────────────────────────────────────────────────────────────
  section('1. MIME type whitelist constants');

  await test('ALLOWED_MIME_TYPES has exactly 4 entries (JPEG, PNG, WebP, GIF)', () => {
    assert.strictEqual(ALLOWED_MIME_TYPES.length, 4);
    assert.ok(ALLOWED_MIME_TYPES.includes('image/jpeg'));
    assert.ok(ALLOWED_MIME_TYPES.includes('image/png'));
    assert.ok(ALLOWED_MIME_TYPES.includes('image/webp'));
    assert.ok(ALLOWED_MIME_TYPES.includes('image/gif'));
  });

  await test('ALLOWED_EXTENSIONS includes .jpg, .jpeg, .png, .webp, .gif', () => {
    ['.jpg', '.jpeg', '.png', '.webp', '.gif'].forEach((ext) => {
      assert.ok(ALLOWED_EXTENSIONS.includes(ext), `Missing extension: ${ext}`);
    });
  });

  await test('MAX_FILE_SIZE is 5MB (5 * 1024 * 1024)', () => {
    assert.strictEqual(MAX_FILE_SIZE, 5 * 1024 * 1024);
  });

  await test('MIN_FILE_SIZE is 1KB (1024 bytes)', () => {
    assert.strictEqual(MIN_FILE_SIZE, 1024);
  });

  // ── 2. File existence check ──────────────────────────────────────────────────
  section('2. File existence check');

  await test('returns error when file does not exist', async () => {
    const result = await validateImageFile('/nonexistent/path/image.jpg');
    assert.strictEqual(result.valid, false);
    assert.ok(/not found/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  // ── 3. File size validation ──────────────────────────────────────────────────
  section('3. File size validation');

  await test('rejects file smaller than 1KB', async () => {
    const buf = Buffer.alloc(512, 0xff);
    const filePath = writeTempFile('tiny.jpg', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/too small/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects file larger than 5MB', async () => {
    const buf = buildFileBuffer(JPEG_MAGIC, MAX_FILE_SIZE + 1);
    const filePath = writeTempFile('oversized.jpg', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/exceeds maximum size/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  // ── 4. Extension validation ──────────────────────────────────────────────────
  section('4. Extension validation');

  await test('rejects .bmp extension', async () => {
    const buf = buildFileBuffer(JPEG_MAGIC);
    const filePath = writeTempFile('image.bmp', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/extension.*not allowed/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects .tiff extension', async () => {
    const buf = buildFileBuffer(JPEG_MAGIC);
    const filePath = writeTempFile('image.tiff', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/extension.*not allowed/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects .exe extension', async () => {
    const buf = buildFileBuffer(JPEG_MAGIC);
    const filePath = writeTempFile('malware.exe', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/extension.*not allowed/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects .php extension', async () => {
    const buf = buildFileBuffer(JPEG_MAGIC);
    const filePath = writeTempFile('shell.php', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/extension.*not allowed/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  // ── 5. Malicious file signature detection ────────────────────────────────────
  section('5. Malicious file signature detection (magic bytes)');

  await test('detects Windows PE executable (MZ header)', () => {
    const buf = buildFileBuffer('4d5a');
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, false);
    assert.ok(/PE executable/i.test(result.threat), `Unexpected threat: ${result.threat}`);
  });

  await test('detects ELF binary', () => {
    const buf = buildFileBuffer('7f454c46');
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, false);
    assert.ok(/ELF/i.test(result.threat), `Unexpected threat: ${result.threat}`);
  });

  await test('detects ZIP archive', () => {
    const buf = buildFileBuffer('504b0304');
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, false);
    assert.ok(/ZIP/i.test(result.threat), `Unexpected threat: ${result.threat}`);
  });

  await test('detects PDF document', () => {
    const buf = buildFileBuffer('25504446');
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, false);
    assert.ok(/PDF/i.test(result.threat), `Unexpected threat: ${result.threat}`);
  });

  await test('detects PHP script (<?php)', () => {
    const buf = buildFileBuffer('3c3f706870');
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, false);
    assert.ok(/PHP/i.test(result.threat), `Unexpected threat: ${result.threat}`);
  });

  await test('detects shell script (#!/ shebang)', () => {
    const buf = buildFileBuffer('23212f');
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, false);
    assert.ok(/shell/i.test(result.threat), `Unexpected threat: ${result.threat}`);
  });

  await test('detects Java class file (0xCAFEBABE)', () => {
    const buf = buildFileBuffer('cafebabe');
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, false);
    assert.ok(result.threat, 'Expected a threat name');
  });

  await test('passes clean JPEG magic bytes', () => {
    const buf = buildFileBuffer(JPEG_MAGIC);
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, true);
  });

  await test('passes clean PNG magic bytes', () => {
    const buf = buildFileBuffer(PNG_MAGIC);
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, true);
  });

  await test('passes clean GIF magic bytes', () => {
    const buf = buildFileBuffer(GIF_MAGIC);
    const result = scanForMaliciousSignatures(buf);
    assert.strictEqual(result.safe, true);
  });

  // ── 6. Malware samples: executables disguised as images ──────────────────────
  section('6. Malware samples: executables disguised as images');

  await test('rejects PE executable with .jpg extension', async () => {
    const buf = buildFileBuffer('4d5a9000', MIN_FILE_SIZE + 100);
    const filePath = writeTempFile('malware.jpg', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/detected.*PE executable/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects ZIP archive with .png extension', async () => {
    const buf = buildFileBuffer('504b0304', MIN_FILE_SIZE + 100);
    const filePath = writeTempFile('archive.png', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/detected.*ZIP/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects PHP script with .gif extension', async () => {
    const buf = buildFileBuffer('3c3f706870', MIN_FILE_SIZE + 100);
    const filePath = writeTempFile('shell.gif', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/detected.*PHP/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects ELF binary with .webp extension', async () => {
    const buf = buildFileBuffer('7f454c46', MIN_FILE_SIZE + 100);
    const filePath = writeTempFile('binary.webp', buf);
    const result = await validateImageFile(filePath);
    assert.strictEqual(result.valid, false);
    assert.ok(/detected.*ELF/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  // ── 7. Cloudinary response validation ────────────────────────────────────────
  section('7. Cloudinary response validation');

  await test('accepts valid HTTPS Cloudinary response', () => {
    const result = validateCloudinaryResponse({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      width: 800,
      height: 600,
      bytes: 102400,
      format: 'jpg',
      public_id: 'campusmitra-chat/abc123',
    });
    assert.strictEqual(result.valid, true);
  });

  await test('rejects HTTP (non-HTTPS) URL', () => {
    const result = validateCloudinaryResponse({
      secure_url: 'http://res.cloudinary.com/demo/image/upload/sample.jpg',
    });
    assert.strictEqual(result.valid, false);
    assert.ok(/HTTPS/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects missing secure_url', () => {
    const result = validateCloudinaryResponse({});
    assert.strictEqual(result.valid, false);
  });

  await test('rejects null response', () => {
    const result = validateCloudinaryResponse(null);
    assert.strictEqual(result.valid, false);
  });

  await test('rejects image exceeding 5MB after Cloudinary processing', () => {
    const result = validateCloudinaryResponse({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      bytes: MAX_FILE_SIZE + 1,
    });
    assert.strictEqual(result.valid, false);
    assert.ok(/size limit/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  await test('rejects oversized dimensions (>10000px)', () => {
    const result = validateCloudinaryResponse({
      secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      width: 15000,
      height: 600,
    });
    assert.strictEqual(result.valid, false);
    assert.ok(/dimensions too large/i.test(result.error), `Unexpected error: ${result.error}`);
  });

  // ── 8. Image dimensions validation ───────────────────────────────────────────
  section('8. Image dimensions validation');

  await test('accepts valid dimensions (1200x800)', () => {
    const result = validateImageDimensions(1200, 800);
    assert.strictEqual(result.valid, true);
  });

  await test('accepts minimum dimensions (1x1)', () => {
    const result = validateImageDimensions(1, 1);
    assert.strictEqual(result.valid, true);
  });

  await test('accepts maximum dimensions (9999x9999)', () => {
    const result = validateImageDimensions(9999, 9999);
    assert.strictEqual(result.valid, true);
  });

  await test('rejects zero width', () => {
    const result = validateImageDimensions(0, 100);
    assert.strictEqual(result.valid, false);
  });

  await test('rejects zero height', () => {
    const result = validateImageDimensions(100, 0);
    assert.strictEqual(result.valid, false);
  });

  await test('rejects width > 10000px', () => {
    const result = validateImageDimensions(10001, 100);
    assert.strictEqual(result.valid, false);
  });

  await test('rejects height > 10000px', () => {
    const result = validateImageDimensions(100, 10001);
    assert.strictEqual(result.valid, false);
  });

  await test('rejects non-integer dimensions', () => {
    const result = validateImageDimensions(1.5, 100);
    assert.strictEqual(result.valid, false);
  });

  // ── 9. Caption sanitization ───────────────────────────────────────────────────
  section('9. Image caption sanitization (XSS prevention)');

  await test('strips HTML tags', () => {
    const result = sanitizeImageCaption('<b>bold</b> text');
    assert.ok(!/[<>]/.test(result), 'HTML tags not stripped');
    assert.ok(result.includes('bold'), 'Text content lost');
  });

  await test('removes XSS script tags', () => {
    const result = sanitizeImageCaption('<script>alert("xss")</script>');
    assert.ok(!result.includes('<script>'), 'Script tag not removed');
    assert.ok(!result.includes('</script>'), 'Closing script tag not removed');
  });

  await test('removes dangerous characters (<>"\')', () => {
    const result = sanitizeImageCaption('Hello <world> "test" \'quote\'');
    assert.ok(!/[<>"']/.test(result), 'Dangerous characters not removed');
  });

  await test('truncates to 500 characters', () => {
    const long = 'a'.repeat(600);
    const result = sanitizeImageCaption(long);
    assert.ok(result.length <= 500, `Caption not truncated: length=${result.length}`);
  });

  await test('returns empty string for null', () => {
    assert.strictEqual(sanitizeImageCaption(null), '');
  });

  await test('returns empty string for undefined', () => {
    assert.strictEqual(sanitizeImageCaption(undefined), '');
  });

  await test('returns empty string for empty string', () => {
    assert.strictEqual(sanitizeImageCaption(''), '');
  });

  await test('returns empty string for non-string (number)', () => {
    assert.strictEqual(sanitizeImageCaption(123), '');
  });

  // ── 10. Safe metadata extraction ─────────────────────────────────────────────
  section('10. Safe image metadata extraction');

  await test('extracts only safe fields from Cloudinary result', () => {
    const cloudinaryResult = {
      width: 800,
      height: 600,
      bytes: 102400,
      format: 'jpg',
      public_id: 'campusmitra-chat/abc123',
      api_key: 'secret-api-key',
      signature: 'secret-signature',
      etag: 'some-etag',
    };
    const metadata = getSafeImageMetadata(cloudinaryResult);
    assert.strictEqual(metadata.width, 800);
    assert.strictEqual(metadata.height, 600);
    assert.strictEqual(metadata.size, 102400);
    assert.strictEqual(metadata.format, 'jpg');
    assert.strictEqual(metadata.publicId, 'campusmitra-chat/abc123');
    assert.ok(!('api_key' in metadata), 'api_key should not be in metadata');
    assert.ok(!('signature' in metadata), 'signature should not be in metadata');
    assert.ok(!('etag' in metadata), 'etag should not be in metadata');
  });

  await test('handles missing fields gracefully (returns null)', () => {
    const metadata = getSafeImageMetadata({});
    assert.strictEqual(metadata.width, null);
    assert.strictEqual(metadata.height, null);
    assert.strictEqual(metadata.size, null);
    assert.strictEqual(metadata.format, null);
    assert.strictEqual(metadata.publicId, null);
  });

  // ── 11. Upload middleware ─────────────────────────────────────────────────────
  section('11. Upload middleware configuration');

  await test('upload middleware exports a multer instance with .single()', () => {
    const upload = require('../src/shared/middleware/upload.middleware');
    assert.ok(upload, 'upload middleware not exported');
    assert.strictEqual(typeof upload.single, 'function', '.single() not a function');
  });

  // ── 12. Rate limiter ──────────────────────────────────────────────────────────
  section('12. Rate limiter — imageUploadLimiter');

  await test('imageUploadLimiter is exported from rateLimiter.middleware', () => {
    const { imageUploadLimiter } = require('../src/shared/middleware/rateLimiter.middleware');
    assert.ok(imageUploadLimiter, 'imageUploadLimiter not exported');
    assert.strictEqual(typeof imageUploadLimiter, 'function', 'imageUploadLimiter not a function');
  });

  // ── 13. Controller exports ────────────────────────────────────────────────────
  section('13. Controller exports');

  await test('uploadChatImage is exported from chat.controller', () => {
    const controller = require('../src/modules/chat/chat.controller');
    assert.strictEqual(typeof controller.uploadChatImage, 'function');
  });

  await test('handleUploadChatImage is exported from chat.controller', () => {
    const controller = require('../src/modules/chat/chat.controller');
    assert.strictEqual(typeof controller.handleUploadChatImage, 'function');
  });

  // ─── Cleanup ──────────────────────────────────────────────────────────────────
  tempFiles.forEach((f) => {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  });

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Image Upload Security Tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('Some tests FAILED.');
    process.exitCode = 1;
  } else {
    console.log('All tests PASSED.');
  }

})();
