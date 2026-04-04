const assert = require('node:assert/strict');
const request = require('supertest');
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
      location: 'Delhi',
    });

  assert.equal(registerResponse.statusCode, 201);
  assert.ok(registerResponse.body.token);
  assert.equal(registerResponse.body.user.email, 'rohit@example.com');
  assert.equal(registerResponse.body.user.role, 'user');
  assert.deepEqual(registerResponse.body.user.wishlist, []);

  await clearDatabase();

  const secondRegisterResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Riya',
      email: 'riya@example.com',
      password: 'password123',
      phone: '8888888888',
      location: 'Mumbai',
    });

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${secondRegisterResponse.body.token}`);

  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.user.name, 'Riya');
  assert.equal(meResponse.body.user.email, 'riya@example.com');
  assert.equal(meResponse.body.user.role, 'user');
};

module.exports = {
  runAuthTests,
};
