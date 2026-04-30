const request = require('supertest');
const User = require('../../models/User');

const registerAndLogin = async (app, overrides = {}) => {
  const uniqueSeed = Date.now() + Math.floor(Math.random() * 1000);
  const payload = {
    name: 'Test User',
    email: `user${uniqueSeed}@example.com`,
    password: 'Password123!',
    phone: `9${String(uniqueSeed).slice(-9).padStart(9, '0')}`,
    location: 'Library Gate',
    profileRole: 'student',
    campus: {
      department: 'Computer Science',
      course: 'B.Tech',
      year: '3rd',
      residentType: 'hosteler',
    },
    ...overrides,
  };

  const otpResponse = await request(app)
    .post('/api/auth/otp/request-signup')
    .send({ email: payload.email });

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      ...payload,
      termsAccepted: true,
      privacyAccepted: true,
      otp: otpResponse.body.otpDebugCode
    });

  if (registerResponse.statusCode !== 201) {
    console.error('Register failed in helper:', registerResponse.body);
  }

  if (registerResponse.body?.user?.id) {
    await User.findByIdAndUpdate(registerResponse.body.user.id, { phoneVerified: true });
  }

  return {
    payload,
    registerResponse,
    token: registerResponse.body.token,
    user: registerResponse.body.user,
  };
};

const promoteUserToAdmin = async (userId) => {
  return User.findByIdAndUpdate(
    userId,
    { role: 'admin', isActive: true, isVerified: true },
    { new: true }
  );
};

module.exports = {
  registerAndLogin,
  promoteUserToAdmin,
};
