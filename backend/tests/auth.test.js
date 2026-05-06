const assert = require('node:assert/strict');
const request = require('supertest');
const { clearDatabase } = require('./helpers/testApp');

const runAuthTests = async (app) => {
  await clearDatabase();

  const otpResponse = await request(app)
    .post('/api/auth/otp/request-signup')
    .send({ email: 'rohit@example.com' });

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Rohit',
      email: 'rohit@example.com',
      password: 'Password123!',
      location: 'Library Gate',
      profileRole: 'student',
      termsAccepted: true,
      privacyAccepted: true,
      otp: otpResponse.body.otpDebugCode,
      campus: {
        department: 'Computer Science',
        year: '3rd',
        residentType: 'hosteler',
      },
    });

  if (registerResponse.statusCode !== 201) {
    console.error('Register failed in auth test:', registerResponse.body);
  }

  assert.equal(registerResponse.statusCode, 201);
  assert.ok(registerResponse.body.token);
  assert.equal(registerResponse.body.user.email, 'rohit@example.com');
  assert.equal(registerResponse.body.user.role, 'user');

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${registerResponse.body.token}`);

  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.user.name, 'Rohit');


};

module.exports = {
  runAuthTests,
};
