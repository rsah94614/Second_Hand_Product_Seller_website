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
        residentType: 'hostel',
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

  const otpRequestResponse = await request(app)
    .post('/api/auth/otp/request-login')
    .send({ phone: '9999999999' });

  assert.equal(otpRequestResponse.statusCode, 200);
  assert.ok(otpRequestResponse.body.otpDebugCode);

  const otpCooldownResponse = await request(app)
    .post('/api/auth/otp/request-login')
    .send({ phone: '9999999999' });

  assert.equal(otpCooldownResponse.statusCode, 429);

  const invalidOtpResponse = await request(app)
    .post('/api/auth/otp/verify-login')
    .send({ phone: '9999999999', otp: '000000' });

  assert.equal(invalidOtpResponse.statusCode, 400);

  const otpVerifyResponse = await request(app)
    .post('/api/auth/otp/verify-login')
    .send({ phone: '9999999999', otp: otpRequestResponse.body.otpDebugCode });

  assert.equal(otpVerifyResponse.statusCode, 200);
  assert.equal(otpVerifyResponse.body.user.phoneVerified, true);

  const storedUser = await User.findOne({ phone: '9999999999' }).select('phoneVerified otpAuth');
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
