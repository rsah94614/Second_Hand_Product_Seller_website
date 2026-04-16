const assert = require('node:assert/strict');
const request = require('supertest');
const { io: Client } = require('socket.io-client');
const Report = require('../models/Report');
const User = require('../models/User');
const { clearDatabase } = require('./helpers/testApp');
const { registerAndLogin } = require('./helpers/auth');

const waitForSocketConnect = (socket) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    socket.off('connect', onConnect);
    socket.off('connect_error', onError);
    reject(new Error('Socket connection timed out'));
  }, 2000);

  const onConnect = () => {
    clearTimeout(timeout);
    socket.off('connect_error', onError);
    resolve();
  };

  const onError = (error) => {
    clearTimeout(timeout);
    socket.off('connect', onConnect);
    reject(error);
  };

  socket.once('connect', onConnect);
  socket.once('connect_error', onError);
});

const waitForEvent = (socket, event, timeoutMs = 2500) => new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    socket.off(event, onEvent);
    reject(new Error(`Socket event \`${event}\` timed out`));
  }, timeoutMs);

  const onEvent = (payload) => {
    clearTimeout(timeout);
    resolve(payload);
  };

  socket.once(event, onEvent);
});

const runChatTests = async (app) => {
  const server = app.server;

  await clearDatabase();

  const alice = await registerAndLogin(app, {
    email: 'chat-alice@example.com',
    name: 'Chat Alice',
  });

  const bob = await registerAndLogin(app, {
    email: 'chat-bob@example.com',
    name: 'Chat Bob',
  });

  const incompleteUser = await registerAndLogin(app, {
    email: 'chat-incomplete@example.com',
    name: 'Chat Incomplete',
    campus: {},
    profileRole: '',
    location: '',
  });
  await User.findByIdAndUpdate(incompleteUser.user.id, { phoneVerified: false });

  if (!server.listening) {
    await new Promise((resolve) => server.listen(0, resolve));
  }

  const port = server.address().port;
  const url = `http://127.0.0.1:${port}`;

  const aliceSocket = Client(url, {
    auth: { token: `Bearer ${alice.token}` },
    transports: ['websocket'],
    forceNew: true,
  });

  const bobSocket = Client(url, {
    auth: { token: `Bearer ${bob.token}` },
    transports: ['websocket'],
    forceNew: true,
  });

  const incompleteSocket = Client(url, {
    auth: { token: `Bearer ${incompleteUser.token}` },
    transports: ['websocket'],
    forceNew: true,
  });

  try {
    await Promise.all([
      waitForSocketConnect(aliceSocket),
      waitForSocketConnect(bobSocket),
      waitForSocketConnect(incompleteSocket),
    ]);

    const receivedMessage = waitForEvent(bobSocket, 'receive_message');
    aliceSocket.emit('send_message', {
      receiver: bob.user.id,
      content: 'Hello Bob from Alice',
    });

    const message = await receivedMessage;
    assert.equal(message.content, 'Hello Bob from Alice');
    assert.equal(message.sender._id, alice.user.id);
    assert.equal(message.receiver._id, bob.user.id);

    const conversationsResponse = await request(app)
      .get('/api/chat/conversations/all')
      .set('Authorization', `Bearer ${bob.token}`);

    assert.equal(conversationsResponse.statusCode, 200);
    assert.equal(conversationsResponse.body.length, 1);
    assert.equal(conversationsResponse.body[0].email, alice.payload.email);

    const messagesResponse = await request(app)
      .get(`/api/chat/${alice.user.id}`)
      .set('Authorization', `Bearer ${bob.token}`);

    assert.equal(messagesResponse.statusCode, 200);
    assert.equal(messagesResponse.body.length, 1);
    assert.equal(messagesResponse.body[0].content, 'Hello Bob from Alice');
    assert.equal(messagesResponse.body[0].read, false);

    const markReadResponse = await request(app)
      .patch(`/api/chat/mark-read/${alice.user.id}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send();

    assert.equal(markReadResponse.statusCode, 200);

    const reportResponse = await request(app)
      .post(`/api/chat/report/${alice.user.id}`)
      .set('Authorization', `Bearer ${bob.token}`)
      .send({
        reason: 'Spam message',
        details: 'Testing the chat reporting flow.',
        messageId: messagesResponse.body[0]._id,
      });

    assert.equal(reportResponse.statusCode, 201);
    const chatReport = await Report.findOne({ reporter: bob.user.id, targetType: 'chat' });
    assert.ok(chatReport);

    const profileIncompleteError = waitForEvent(incompleteSocket, 'error');
    incompleteSocket.emit('send_message', {
      receiver: bob.user.id,
      content: 'Hey Bob, can we chat?',
    });

    const incompleteError = await profileIncompleteError;
    assert.match(incompleteError.message, /complete and verify your campus profile/i);

    for (let index = 0; index < 3; index += 1) {
      aliceSocket.emit('send_message', {
        receiver: bob.user.id,
        content: 'Repeat spam payload',
      });
    }

    const spamError = await waitForEvent(aliceSocket, 'error');
    assert.match(spamError.message, /same message repeatedly/i);
  } finally {
    aliceSocket.close();
    bobSocket.close();
    incompleteSocket.close();
  }
};

module.exports = {
  runChatTests,
};
