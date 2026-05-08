/**
 * Message Delivery & Acknowledgment Utilities
 * Addresses Issues 1 & 4:
 * - Issue 1: Race Condition - Message Delivery vs Read Status
 * - Issue 4: Unhandled Socket Disconnection During Message Send
 */

/**
 * In-memory store for pending message deliveries
 * Structure: { messageId: { senderId, receiverId, timestamp, delivered: boolean } }
 */
const pendingDeliveries = new Map();

/**
 * Cleanup interval for stale delivery records (30 minutes)
 */
const DELIVERY_TIMEOUT = 30 * 60 * 1000;

/**
 * Start cleanup interval for pending deliveries
 */
const startDeliveryCleanup = () => {
  setInterval(() => {
    const now = Date.now();
    for (const [messageId, delivery] of pendingDeliveries.entries()) {
      if (now - delivery.timestamp > DELIVERY_TIMEOUT) {
        pendingDeliveries.delete(messageId);
      }
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
};

/**
 * Register a message as pending delivery
 * Called when message is saved to database
 */
const registerPendingDelivery = (messageId, senderId, receiverId) => {
  pendingDeliveries.set(messageId, {
    senderId: senderId.toString(),
    receiverId: receiverId.toString(),
    timestamp: Date.now(),
    delivered: false,
    readAt: null,
  });
};

/**
 * Mark message as delivered to recipient
 * Called when receiver's socket receives the message
 */
const markMessageDelivered = (messageId) => {
  const delivery = pendingDeliveries.get(messageId);
  if (delivery) {
    delivery.delivered = true;
  }
};

/**
 * Mark message as read by recipient
 * ONLY called after delivery is confirmed
 */
const markMessageRead = (messageId) => {
  const delivery = pendingDeliveries.get(messageId);
  if (delivery && delivery.delivered) {
    delivery.readAt = Date.now();
    return true; // Safe to mark as read
  }
  return false; // Delivery not confirmed yet
};

/**
 * Check if message delivery is confirmed
 */
const isMessageDelivered = (messageId) => {
  const delivery = pendingDeliveries.get(messageId);
  return delivery ? delivery.delivered : false;
};

/**
 * Get delivery status for a message
 */
const getDeliveryStatus = (messageId) => {
  const delivery = pendingDeliveries.get(messageId);
  if (!delivery) {
    return { status: 'unknown', delivered: false, read: false };
  }

  return {
    status: delivery.readAt ? 'read' : delivery.delivered ? 'delivered' : 'pending',
    delivered: delivery.delivered,
    read: !!delivery.readAt,
    deliveredAt: delivery.delivered ? delivery.timestamp : null,
    readAt: delivery.readAt,
  };
};

/**
 * Clear delivery record (after confirmed read or timeout)
 */
const clearDeliveryRecord = (messageId) => {
  pendingDeliveries.delete(messageId);
};

/**
 * Get all pending deliveries for a user
 */
const getPendingDeliveriesForUser = (userId) => {
  const userIdStr = userId.toString();
  const pending = [];

  for (const [messageId, delivery] of pendingDeliveries.entries()) {
    if (delivery.receiverId === userIdStr && !delivery.delivered) {
      pending.push({
        messageId,
        senderId: delivery.senderId,
        timestamp: delivery.timestamp,
      });
    }
  }

  return pending;
};

/**
 * Socket handler for delivery acknowledgment
 * Receiver emits this when they receive the message
 */
const handleDeliveryAck = (messageId, receiverId) => {
  const delivery = pendingDeliveries.get(messageId);

  if (!delivery) {
    return { success: false, error: 'Delivery record not found' };
  }

  if (delivery.receiverId !== receiverId.toString()) {
    return { success: false, error: 'Unauthorized' };
  }

  markMessageDelivered(messageId);
  return { success: true, status: 'delivered' };
};

/**
 * Socket handler for read acknowledgment
 * Receiver emits this when they read the message
 */
const handleReadAck = (messageId, receiverId) => {
  const delivery = pendingDeliveries.get(messageId);

  if (!delivery) {
    return { success: false, error: 'Delivery record not found' };
  }

  if (delivery.receiverId !== receiverId.toString()) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!delivery.delivered) {
    return { success: false, error: 'Message not yet delivered' };
  }

  const marked = markMessageRead(messageId);
  if (!marked) {
    return { success: false, error: 'Cannot mark as read before delivery' };
  }

  return { success: true, status: 'read' };
};

module.exports = {
  startDeliveryCleanup,
  registerPendingDelivery,
  markMessageDelivered,
  markMessageRead,
  isMessageDelivered,
  getDeliveryStatus,
  clearDeliveryRecord,
  getPendingDeliveriesForUser,
  handleDeliveryAck,
  handleReadAck,
};
