const isLocalhostUrl = (value = '') => {
  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const emailProvider = (process.env.EMAIL_PROVIDER || 'smtp').trim().toLowerCase();

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required.');
  } else if (process.env.JWT_SECRET.length < 16) {
    warnings.push('JWT_SECRET is shorter than recommended. Use a long random secret.');
  }

  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI is required.');
  }

  if (!process.env.CLIENT_URL) {
    warnings.push('CLIENT_URL is not set. The backend will fall back to localhost.');
  } else if (isProduction && isLocalhostUrl(process.env.CLIENT_URL)) {
    errors.push('CLIENT_URL points to localhost in production.');
  }

  if (
    process.env.COOKIE_SAME_SITE?.toLowerCase() === 'none' &&
    process.env.COOKIE_SECURE !== 'true'
  ) {
    errors.push('COOKIE_SECURE must be true when COOKIE_SAME_SITE is set to none.');
  }

  if (
    isProduction &&
    (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)
  ) {
    errors.push('Cloudinary credentials are required in production.');
  }

  if (isProduction && emailProvider === 'brevo') {
    if (!(process.env.BREVO_API_KEY || '').trim()) {
      warnings.push('BREVO_API_KEY is missing. OTP and password reset emails will fail.');
    }

    if (!(process.env.EMAIL_FROM || process.env.EMAIL_USER || '').trim()) {
      warnings.push('EMAIL_FROM is missing. Brevo email delivery will fail.');
    }
  } else if (
    isProduction &&
    (!(process.env.EMAIL_USER || '').trim() || !(process.env.EMAIL_PASS || '').trim())
  ) {
    warnings.push('EMAIL_USER or EMAIL_PASS is missing. SMTP OTP and password reset emails will fail.');
  }

  warnings.forEach((warning) => {
    console.warn(`[config warning] ${warning}`);
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }
};

module.exports = {
  validateEnvironment,
};
