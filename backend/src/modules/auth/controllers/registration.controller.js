const User = require('../../../../models/User');
const RegistrationOtp = require('../../../../models/RegistrationOtp');
const { sendSignupOtpEmail } = require('../../../shared/utils/emailService');
const { validatePasswordStrength, isCommonPassword } = require('../../../shared/utils/passwordValidator');
const {
  detectCollegeDomain,
  hashOtpCode,
  generateOtpCode,
  otpDebugPayload,
  issueSession,
} = require('../auth.service');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;

const buildOtpResponse = (basePayload, code) => ({
  ...basePayload,
  ...otpDebugPayload(code),
  cooldownSeconds: Math.floor(OTP_COOLDOWN_MS / 1000),
  expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
});

const register = async (req, res) => {
  try {
    const { name, email, password, location, campus, profileRole, otp, termsAccepted, privacyAccepted } = req.body;

    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions to register' });
    }

    if (!privacyAccepted) {
      return res.status(400).json({ message: 'You must accept the privacy policy to register' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
      });
    }

    if (isCommonPassword(password)) {
      return res.status(400).json({
        message: 'Password is too common. Please choose a stronger password.',
      });
    }

    if (!otp) {
      return res.status(400).json({ message: 'Email verification is required to complete registration' });
    }

    const regOtp = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (!regOtp) {
      return res.status(400).json({ message: 'No active verification request found for this email' });
    }

    if (new Date(regOtp.expiresAt).getTime() < Date.now()) {
      await RegistrationOtp.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    if (regOtp.codeHash !== hashOtpCode(otp)) {
      regOtp.attemptsLeft -= 1;
      if (regOtp.attemptsLeft <= 0) {
        await RegistrationOtp.deleteOne({ email: normalizedEmail });
        return res.status(400).json({ message: 'Too many invalid attempts. Please request a new code.' });
      }
      await regOtp.save();
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const collegeInfo = detectCollegeDomain(normalizedEmail);
    const isVerified = !!collegeInfo?.verified;

    const campusData = {
      department: campus?.department || '',
      course: campus?.course || '',
      year: campus?.year || '',
      semester: campus?.semester || '',
      hostel: campus?.hostel || '',
      residentType: campus?.residentType || '',
    };

    const user = new User({
      name,
      email: normalizedEmail,
      password,
      location,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyAccepted: true,
      privacyAcceptedAt: new Date(),
      campus: campusData,
      profileRole: profileRole || 'student',
      isVerified,
      emailVerified: true,
      role: 'user',
    });

    user.refreshTokens = [];
    await user.save();

    await RegistrationOtp.deleteOne({ email: normalizedEmail });

    const body = await issueSession(req, res, user, 'Account created successfully. Email verified.');
    return res.status(201).json(body);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    return res.status(500).json({ message: error.message });
  }
};

const requestSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Auth] Signup OTP requested for: ${normalizedEmail}`);
    const start = Date.now();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login instead.' });
    }

    const now = Date.now();

    const existingOtp = await RegistrationOtp.findOne({ email: normalizedEmail });
    if (existingOtp && now - new Date(existingOtp.requestedAt).getTime() < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - new Date(existingOtp.requestedAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting another code.`, cooldownSeconds: waitSeconds });
    }

    const code = generateOtpCode();

    await RegistrationOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        codeHash: hashOtpCode(code),
        expiresAt: new Date(now + OTP_TTL_MS),
        requestedAt: new Date(now),
        attemptsLeft: 3,
      },
      { upsert: true }
    );
    console.log(`[Auth] OTP DB operations took: ${Date.now() - start}ms`);

    try {
      console.log(`[Auth] Dispatching signup OTP email to ${normalizedEmail}...`);
      await sendSignupOtpEmail(normalizedEmail, code);
      console.log(`[Auth] Signup OTP email dispatch SUCCESS for: ${normalizedEmail}`);
    } catch (error) {
      await RegistrationOtp.deleteOne({ email: normalizedEmail, codeHash: hashOtpCode(code) });
      console.error(`[Auth] Signup OTP email dispatch FAILED for ${normalizedEmail}:`, error.message);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n[DEV ONLY] SIGNUP OTP FOR ${normalizedEmail}: ${code} (Email failed but code was not saved)\n`);
      }
      return res.status(503).json({
        message: 'Could not send verification code right now. Please try again later.',
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[DEV ONLY] SIGNUP OTP FOR ${normalizedEmail}: ${code}\n`);
    }

    return res.json(buildOtpResponse({ message: 'Verification code sent to your email address.', email: normalizedEmail }, code));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  requestSignupOtp,
};
