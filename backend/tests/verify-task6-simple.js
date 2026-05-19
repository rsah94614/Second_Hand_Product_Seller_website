/**
 * Task 6: Update `markConversationAsRead` to emit read status
 * 
 * This simplified test verifies that:
 * 1. The markRead endpoint updates messages in the database
 * 2. The endpoint returns the correct response
 * 3. The endpoint includes markedCount in the response
 */

const assert = require('node:assert/strict');
const request = require('supertest');
const Message = require('../models/Message');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');

const runVerifyTask6Simple = async (app) => {
  await clearDatabase();

  const alice = await registerAndLogin(app, {
    email: 'task6-simple-alice@example.com',
    name: 'Task6 Simple Alice',
  });

  const bob = await registerAndLogin(app, {
    email: 'task6-simple-bob@example.com',
    name: 'Task6 Simple Bob',
  });

  console.log('\n✓ Users created\n');

  // Step 1: Create a message from Alice to Bob
  console.log('Step 1: Create a message from Alice to Bob');
  await Message.create({
    sender: alice.user.id,
    receiver: bob.user.id,
    content: 'Hello Bob from Alice',
    read: false,
  });
  console.log('✓ Message created\n');

  // Step 2: Verify message is unread
  console.log('Step 2: Verify message is unread');
  const messagesResponse = await request(app)
    .get(`/api/chat/${alice.user.id}`)
    .set('Authorization', `Bearer ${bob.token}`);

  assert.equal(messagesResponse.statusCode, 200);
  assert.equal(messagesResponse.body.length, 1);
  assert.equal(messagesResponse.body[0].read, false);
  console.log('✓ Message is unread\n');

  // Step 3: Bob marks the conversation as read
  console.log('Step 3: Bob marks the conversation as read');
  const markReadResponse = await request(app)
    .patch(`/api/chat/mark-read/${alice.user.id}`)
    .set('Authorization', `Bearer ${bob.token}`)
    .send();

  assert.equal(markReadResponse.statusCode, 200);
  assert.ok(markReadResponse.body.message);
  assert.equal(markReadResponse.body.message, 'Messages marked as read');
  console.log('✓ markRead endpoint returned 200\n');

  // Step 4: Verify response includes markedCount
  console.log('Step 4: Verify response includes markedCount');
  assert.ok(typeof markReadResponse.body.markedCount === 'number');
  assert.equal(markReadResponse.body.markedCount, 1);
  console.log(`✓ Response includes markedCount: ${markReadResponse.body.markedCount}\n`);

  // Step 5: Verify message is marked as read in database
  console.log('Step 5: Verify message is marked as read in database');
  const updatedMessagesResponse = await request(app)
    .get(`/api/chat/${alice.user.id}`)
    .set('Authorization', `Bearer ${bob.token}`);

  assert.equal(updatedMessagesResponse.statusCode, 200);
  assert.equal(updatedMessagesResponse.body.length, 1);
  assert.equal(updatedMessagesResponse.body[0].read, true);
  assert.ok(updatedMessagesResponse.body[0].readAt, 'readAt should be set');
  console.log('✓ Message is marked as read in database\n');

  // Step 6: Verify readAt timestamp is recent
  console.log('Step 6: Verify readAt timestamp is recent');
  const readAtTime = new Date(updatedMessagesResponse.body[0].readAt).getTime();
  const now = Date.now();
  const timeDiff = now - readAtTime;
  assert.ok(timeDiff >= 0 && timeDiff < 5000, 'readAt should be within last 5 seconds');
  console.log(`✓ readAt timestamp is recent (${timeDiff}ms ago)\n`);

  console.log('✅ All requirements met:\n');
  console.log('  ✓ The markRead endpoint updates messages in the database');
  console.log('  ✓ The endpoint returns the correct response');
  console.log('  ✓ The endpoint includes markedCount in the response');
  console.log('  ✓ The readAt timestamp is set correctly\n');
};

module.exports = {
  runVerifyTask6Simple,
};
