const assert = require('node:assert/strict');
const request = require('supertest');
const User = require('../models/User');
const { clearDatabase } = require('./helpers/testApp');

const runAuthTests = async (app) => {
  await clearDatabase();

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Rohit',
      email: 'rohit@example.com',
      password: 'password123',
      phone: '9999999999',
      location: 'Library Gate',
      profileRole: 'student',
      campus: {
        collegeName: 'Gauhati University',
        department: 'Computer Science',
        year: '3rd',
        residentType: 'hosteler',
      },
    });

  assert.equal(registerResponse.statusCode, 201);
  assert.ok(registerResponse.body.token);
  assert.equal(registerResponse.body.user.email, 'rohit@example.com');
  assert.equal(registerResponse.body.user.role, 'user');
  assert.equal(registerResponse.body.user.phoneVerified, false);

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${registerResponse.body.token}`);

  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.user.name, 'Rohit');

  // Test Phone + Password Login (New unified flow)
  const phoneLoginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: '9999999999', // 'email' field used as generic identifier
      password: 'password123',
    });

  assert.equal(phoneLoginResponse.statusCode, 200, `Phone login failed: ${JSON.stringify(phoneLoginResponse.body)}`);
  assert.ok(phoneLoginResponse.body.token);
  assert.equal(phoneLoginResponse.body.user.phone, '+919999999999');

  const storedUser = await User.findOne({ phone: '+919999999999' }).select('phoneVerified otpAuth');
  assert.equal(storedUser.phoneVerified, true);
  assert.equal(storedUser.otpAuth.purpose, '');

  const verificationRequestResponse = await request(app)
    .post('/api/auth/otp/request-verification')
    .set('Authorization', `Bearer ${registerResponse.body.token}`);

  assert.equal(verificationRequestResponse.statusCode, 200);
  assert.ok(verificationRequestResponse.body.otpDebugCode);

  const verificationResponse = await request(app)
    .post('/api/auth/otp/verify-phone')
    .set('Authorization', `Bearer ${registerResponse.body.token}`)
    .send({ otp: verificationRequestResponse.body.otpDebugCode });

  assert.equal(verificationResponse.statusCode, 200);
  assert.match(verificationResponse.body.message, /verified/i);
};

module.exports = {
  runAuthTests,
};
