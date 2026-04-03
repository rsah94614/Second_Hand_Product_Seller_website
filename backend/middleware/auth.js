const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizeUserRole = async (user) => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (adminEmail && user.email?.toLowerCase() === adminEmail && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
    return user;
  }

  if (user.role) {
    if (user.role !== 'admin' && user.role !== 'user') {
      user.role = 'user';
      await user.save();
    }
    return user;
  }

  user.role = 'user';
  await user.save();
  return user;
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    user = await normalizeUserRole(user);

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to access this resource' });
  }

  return next();
};

const adminAuth = [auth, authorizeRoles('admin')];
const userAuth = [auth, authorizeRoles('user')];

module.exports = auth;
module.exports.auth = auth;
module.exports.authorizeRoles = authorizeRoles;
module.exports.adminAuth = adminAuth;
module.exports.userAuth = userAuth;
