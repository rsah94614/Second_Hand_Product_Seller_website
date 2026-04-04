const request = require('supertest');
const User = require('../../models/User');

const registerAndLogin = async (app, overrides = {}) => {
  const payload = {
    name: 'Test User',
    email: `user${Date.now()}@example.com`,
    password: 'password123',
    phone: '9876543210',
    location: 'Kolkata',
    ...overrides,
  };

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send(payload);

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
