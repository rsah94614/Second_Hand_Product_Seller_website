/**
 * newUser.middleware.js
 * Guards for new / incomplete accounts.
 */
const User = require('../../../models/User');
const Product = require('../../../models/Product');
const { canTradeOnCampus } = require('../utils/profileCompletion.utils');

/**
 * Middleware: requires campus trading profile completion before allowing
 * listing creation or chat initiation.
 */
const enforceProfileRequired = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name phone phoneVerified avatar campus profileRole location createdAt'
    );

    if (!user) return res.status(401).json({ message: 'User not found' });

    const { score, missing, canTrade } = canTradeOnCampus(user);

    if (!canTrade) {
      return res.status(403).json({
        message: 'Please complete your profile before you can create listings or start chats.',
        code: 'PROFILE_INCOMPLETE',
        profileCompletionScore: score,
        missing,
      });
    }

    req.profileCompletionScore = score;
    req.profileMissing = missing;
    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware: enforces a daily listing cap for new accounts.
 * Accounts < 7 days: max 3 active listings total, max 2 created today.
 */
const enforceNewUserListingCap = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'createdAt listingsCreatedToday lastListingDate'
    );

    if (!user) return res.status(401).json({ message: 'User not found' });

    const ageDays =
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    if (ageDays >= 7) return next(); // Restrictions only for new accounts

    // Reset daily count if date changed
    const today = new Date().toDateString();
    const lastDate = user.lastListingDate
      ? new Date(user.lastListingDate).toDateString()
      : null;

    const todayCount = lastDate === today ? (user.listingsCreatedToday || 0) : 0;

    if (todayCount >= 2) {
      return res.status(429).json({
        message: 'New accounts can create at most 2 listings per day. Try again tomorrow.',
        code: 'DAILY_LISTING_CAP',
      });
    }

    // Check total active listings
    const activeCount = await Product.countDocuments({
      seller: user._id,
      isActive: true,
      isSold: false,
    });

    if (activeCount >= 3) {
      return res.status(429).json({
        message: 'New accounts can have at most 3 active listings. Mark some as sold or remove them first.',
        code: 'TOTAL_LISTING_CAP',
      });
    }

    // Store resolved values for controller to update after creation
    req.newUserListingMeta = { todayCount };
    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware: block suspended users from performing any action.
 * Should be placed right after auth middleware on protected routes.
 */
const blockSuspendedUser = async (req, res, next) => {
  try {
    if (req.user?.isSuspended) {
      return res.status(403).json({
        message: `Your account has been suspended. Reason: ${req.user.suspendedReason || 'Violation of campus marketplace rules.'}`,
        code: 'ACCOUNT_SUSPENDED',
      });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  enforceProfileRequired,
  enforceNewUserListingCap,
  blockSuspendedUser,
};
