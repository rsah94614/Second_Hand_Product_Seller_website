const assert = require('node:assert/strict');
const { io: Client } = require('socket.io-client');
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

const runSocketDeliveryTests = async (app) => {
  const server = app.server;

  await clearDatabase();

  const alice = await registerAndLogin(app, {
    email: 'delivery-alice@example.com',
    name: 'Delivery Alice',
  });

  const bob = await registerAndLogin(app, {
    email: 'delivery-bob@example.com',
    name: 'Delivery Bob',
  });

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

  try {
    await Promise.all([
      waitForSocketConnect(aliceSocket),
      waitForSocketConnect(bobSocket),
    ]);

    // Test 1: Send message and verify delivery acknowledgment
    console.log('Test 1: Send message and verify delivery acknowledgment');
    const receivedMessage = waitForEvent(bobSocket, 'receive_message');
    
    aliceSocket.emit('send_message', {
      receiver: bob.user.id,
      content: 'Test delivery message',
    }, (ack) => {
      console.log('Send message acknowledgment:', ack);
    });

    const message = await receivedMessage;
    assert.equal(message.content, 'Test delivery message');
    assert.equal(message.sender._id, alice.user.id);
    assert.equal(message.receiver._id, bob.user.id);
    console.log('✓ Message received successfully');

    // Test 2: Bob sends delivery acknowledgment
    console.log('\nTest 2: Bob sends delivery acknowledgment');
    const deliveryAckPromise = new Promise((resolve) => {
      bobSocket.emit('message_delivered', { messageId: message._id }, (result) => {
        console.log('Delivery acknowledgment result:', result);
        resolve(result);
      });
    });

    const deliveryResult = await deliveryAckPromise;
    assert.equal(deliveryResult.success, true);
    assert.equal(deliveryResult.status, 'delivered');
    console.log('✓ Delivery acknowledgment successful');

    // Test 3: Bob sends read acknowledgment
    console.log('\nTest 3: Bob sends read acknowledgment');
    const readAckPromise = new Promise((resolve) => {
      bobSocket.emit('message_read', { messageId: message._id }, (result) => {
        console.log('Read acknowledgment result:', result);
        resolve(result);
      });
    });

    const readResult = await readAckPromise;
    assert.equal(readResult.success, true);
    assert.equal(readResult.status, 'read');
    console.log('✓ Read acknowledgment successful');

    // Test 4: Verify delivery acknowledgment fails for unauthorized user
    console.log('\nTest 4: Verify delivery acknowledgment fails for unauthorized user');
    const unauthorizedAckPromise = new Promise((resolve) => {
      aliceSocket.emit('message_delivered', { messageId: message._id }, (result) => {
        console.log('Unauthorized delivery acknowledgment result:', result);
        resolve(result);
      });
    });

    const unauthorizedResult = await unauthorizedAckPromise;
    assert.equal(unauthorizedResult.success, false);
    assert.match(unauthorizedResult.error, /Unauthorized/i);
    console.log('✓ Unauthorized delivery acknowledgment rejected');

    // Test 5: Verify read acknowledgment fails before delivery
    console.log('\nTest 5: Verify read acknowledgment fails before delivery');
    const receivedMessage2 = waitForEvent(bobSocket, 'receive_message');
    
    aliceSocket.emit('send_message', {
      receiver: bob.user.id,
      content: 'Test read before delivery',
    });

    const message2 = await receivedMessage2;
    
    const readBeforeDeliveryPromise = new Promise((resolve) => {
      bobSocket.emit('message_read', { messageId: message2._id }, (result) => {
        console.log('Read before delivery result:', result);
        resolve(result);
      });
    });

    const readBeforeDeliveryResult = await readBeforeDeliveryPromise;
    assert.equal(readBeforeDeliveryResult.success, false);
    assert.match(readBeforeDeliveryResult.error, /not yet delivered/i);
    console.log('✓ Read before delivery rejected');

  } finally {
    aliceSocket.close();
    bobSocket.close();
  }
};

module.exports = {
  runSocketDeliveryTests,
};
