const AuditLog = require('../../../models/AuditLog');
const logger = require('./logger.util');

const logAuditAction = async ({ action, actor, targetType, targetId, details, req }) => {
  try {
    const auditEntry = new AuditLog({
      action,
      actor,
      targetType,
      targetId,
      details,
      ipAddress: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.get('User-Agent'),
    });

    await auditEntry.save();
    
    logger.info(`Audit: ${action} on ${targetType}`, {
      actorId: actor.toString(),
      targetId: targetId?.toString(),
    });

  } catch (error) {
    logger.error('Failed to save audit log', { error: error.message, action });
  }
};

module.exports = {
  logAuditAction,
};
