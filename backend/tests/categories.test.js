const assert = require('node:assert/strict');
const request = require('supertest');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin, promoteUserToAdmin } = require('./helpers/auth');

const runCategoryTests = async (app) => {
  await clearDatabase();

  const admin = await registerAndLogin(app, {
    email: 'category-admin@example.com',
    name: 'Category Admin',
  });
  await promoteUserToAdmin(admin.user.id);

  const listResponse = await request(app)
    .get('/api/categories/admin/all')
    .set('Authorization', `Bearer ${admin.token}`);

  assert.equal(listResponse.statusCode, 200);
  assert.ok(listResponse.body.categories.length > 0);

  const createResponse = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      name: 'Musical Instruments',
      description: 'Guitars, keyboards, and accessories.',
      sortOrder: 25,
    });

  assert.equal(createResponse.statusCode, 201);
  assert.equal(createResponse.body.category.name, 'Musical Instruments');

  const updateResponse = await request(app)
    .put(`/api/categories/${createResponse.body.category._id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      name: 'Music Gear',
      description: 'Updated category title for test coverage.',
      sortOrder: 26,
      isActive: true,
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.category.name, 'Music Gear');

  const deleteResponse = await request(app)
    .delete(`/api/categories/${createResponse.body.category._id}`)
    .set('Authorization', `Bearer ${admin.token}`);

  assert.equal(deleteResponse.statusCode, 200);
};

module.exports = {
  runCategoryTests,
};
