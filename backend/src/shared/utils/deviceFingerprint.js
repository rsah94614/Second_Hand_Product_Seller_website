const crypto = require('crypto');
const UAParser = require('ua-parser-js');

/**
 * Generate device fingerprint from user agent and IP
 */
const generateFingerprint = (userAgent, ipAddress) => {
  const combined = `${userAgent}|${ipAddress}`;
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex');
};

/**
 * Parse user agent to get device info
 */
const parseUserAgent = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    deviceType: result.device.type || 'desktop',
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    deviceName: `${result.browser.name || 'Unknown'} on ${result.os.name || 'Unknown'}`,
  };
};

/**
 * Get device info from request
 */
const getDeviceInfo = (req) => {
  const userAgent = req.get('user-agent') || 'Unknown';
  const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
  const fingerprint = generateFingerprint(userAgent, ipAddress);
  const deviceInfo = parseUserAgent(userAgent);

  return {
    fingerprint,
    userAgent,
    ipAddress,
    ...deviceInfo,
  };
};

module.exports = {
  generateFingerprint,
  parseUserAgent,
  getDeviceInfo,
};
