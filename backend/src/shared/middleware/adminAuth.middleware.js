'use strict';

const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const logger = require('../../services/logger.service');

/**
 * Phase 4.3 - Admin Authentication and Authorization Middleware
 * 
 * Verifies user authentication and admin role for all report endpoints.
 * Denies non-admin users with 403 error.
 * Redirects unauthenticated users to login.
 * Extracts admin ID and passes to request context.
 */

/**
 * Verify admin authentication
 * Checks for valid JWT token and admin role
 */
const verifyAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('bearer '))
      ? authHeader.slice(7)
      : null;

    // No token provided - redirect to login
    if (!token) {
      logger.warn('Admin endpoint accessed without authentication', {
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
        code: 'UNAUTHENTICATED',
        redirectTo: '/login',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.warn('Invalid token provided', {
        path: req.path,
        error: error.message,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
        code: 'INVALID_TOKEN',
        redirectTo: '/login',
      });
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      logger.warn('User not found for token', {
        userId: decoded.userId,
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
        code: 'USER_NOT_FOUND',
        redirectTo: '/login',
      });
    }

    // Check if user account is active
    if (user.isActive === false) {
      logger.warn('Inactive user attempted admin access', {
        userId: user._id,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Check admin role
    if (user.role !== 'admin') {
      logger.warn('Non-admin user attempted admin access', {
        userId: user._id,
        userRole: user.role,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource. Admin access required.',
        code: 'FORBIDDEN',
      });
    }

    // Attach user and admin ID to request context
    req.user = user;
    req.adminId = user._id;

    logger.info('Admin authenticated successfully', {
      adminId: user._id,
      path: req.path,
      ip: req.ip,
    });

    return next();
  } catch (error) {
    logger.error('Admin authentication error', {
      error: error.message,
      path: req.path,
      ip: req.ip,
    });
    return res.status(500).json({
      success: false,
      message: 'Authentication error. Please try again.',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Check admin role (used as secondary check)
 * Assumes user is already authenticated
 */
const checkAdminRole = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'UNAUTHENTICATED',
    });
  }

  if (req.user.role !== 'admin') {
    logger.warn('Non-admin user attempted admin operation', {
      userId: req.user._id,
      userRole: req.user.role,
      path: req.path,
      ip: req.ip,
    });
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to perform this action.',
      code: 'FORBIDDEN',
    });
  }

  return next();
};

/**
 * Extract admin ID from request context
 * Assumes user is already authenticated and authorized
 */
const extractAdminId = (req, res, next) => {
  if (req.user && req.user._id) {
    req.adminId = req.user._id;
  }
  return next();
};

module.exports = {
  verifyAdminAuth,
  checkAdminRole,
  extractAdminId,
};
