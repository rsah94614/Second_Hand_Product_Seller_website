/**
 * Reputation Service (Task 2.7.2)
 * Calculate comprehensive reputation scores for sellers
 */

const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Message = require('../../models/Message');

/**
 * Calculate comprehensive reputation score for a user
 * @param {String} userId - User ID
 * @returns {Object} - Reputation data
 */
const calculateReputation = async (userId) => {
  try {
    // Get user's orders as seller
    const sellerOrders = await Order.find({
      'items.seller': userId,
      status: { $in: ['completed', 'cancelled', 'no_show'] },
    }).lean();

    // Get user's products
    const products = await Product.find({ seller: userId }).lean();

    // Get user's chat messages for response time
    const messages = await Message.find({
      receiver: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    })
      .sort({ createdAt: 1 })
      .lean();

    // Calculate metrics
    const totalOrders = sellerOrders.length;
    const completedOrders = sellerOrders.filter(o => o.status === 'completed').length;
    const cancelledOrders = sellerOrders.filter(o => o.status === 'cancelled').length;
    const noShowOrders = sellerOrders.filter(o => o.status === 'no_show').length;

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? ((cancelledOrders + noShowOrders) / totalOrders) * 100 : 0;

    // Calculate average response time (in hours)
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const message of messages) {
      // Find first response from seller
      const response = await Message.findOne({
        sender: userId,
        receiver: message.sender,
        createdAt: { $gte: message.createdAt },
      })
        .sort({ createdAt: 1 })
        .lean();

      if (response) {
        const responseTime = (new Date(response.createdAt) - new Date(message.createdAt)) / (1000 * 60 * 60); // hours
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Get review stats from products
    const totalReviews = products.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
    const totalRating = products.reduce((sum, p) => sum + ((p.averageRating || 0) * (p.reviewCount || 0)), 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Calculate reputation score (0-100)
    let score = 0;

    // Completion rate (40% weight)
    score += completionRate * 0.4;

    // Average rating (30% weight)
    score += (averageRating / 5) * 30;

    // Response time (15% weight) - faster is better
    const responseTimeScore = Math.max(0, 24 - averageResponseTime) / 24;
    score += responseTimeScore * 15;

    // Cancellation rate (15% weight) - lower is better
    const cancellationScore = Math.max(0, 100 - cancellationRate * 10);
    score += cancellationScore * 0.15;

    // Calculate trust labels
    const trustLabels = [];
    if (score >= 80) trustLabels.push('Trusted Seller');
    if (averageRating >= 4.5 && totalReviews >= 10) trustLabels.push('Top Rated');
    if (averageResponseTime < 2) trustLabels.push('Fast Responder');
    if (completionRate >= 95) trustLabels.push('Reliable');
    if (totalOrders >= 50) trustLabels.push('Experienced');

    return {
      score: Math.round(score * 10) / 10, // Round to 1 decimal
      responseTime: Math.round(averageResponseTime * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: totalReviews,
      totalOrders,
      completedOrders,
      trustLabels,
    };
  } catch (error) {
    console.error('Error calculating reputation:', error);
    return {
      score: 0,
      responseTime: 0,
      completionRate: 0,
      cancellationRate: 0,
      averageRating: 0,
      reviewCount: 0,
      totalOrders: 0,
      completedOrders: 0,
      trustLabels: [],
    };
  }
};

/**
 * Get reputation history for a user
 * @param {String} userId - User ID
 * @param {Number} days - Number of days to look back
 * @returns {Array} - Reputation history
 */
const getReputationHistory = async (userId, days = 30) => {
  try {
    const history = [];
    const now = new Date();

    // Calculate reputation for each week in the period
    for (let i = 0; i < days; i += 7) {
      const endDate = new Date(now - i * 24 * 60 * 60 * 1000);
      const startDate = new Date(endDate - 7 * 24 * 60 * 60 * 1000);

      // Get orders in this period
      const orders = await Order.find({
        'items.seller': userId,
        status: { $in: ['completed', 'cancelled', 'no_show'] },
        createdAt: { $gte: startDate, $lte: endDate },
      }).lean();

      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

      history.push({
        date: endDate.toISOString().split('T')[0],
        totalOrders,
        completedOrders,
        completionRate: Math.round(completionRate * 10) / 10,
      });
    }

    return history.reverse();
  } catch (error) {
    console.error('Error getting reputation history:', error);
    return [];
  }
};

/**
 * Check if user meets seller verification criteria
 * @param {Object} user - User object
 * @param {Object} reputation - Reputation data
 * @returns {Object} - Verification eligibility
 */
const checkVerificationEligibility = (user, reputation) => {
  const criteria = {
    emailVerified: user.emailVerified === true,
    minOrders: reputation.totalOrders >= 5,
    minRating: reputation.averageRating >= 4.0,
    noSuspension: !user.isSuspended,
    completionRate: reputation.completionRate >= 80,
  };

  const eligible = Object.values(criteria).every(c => c === true);

  return {
    eligible,
    criteria,
    message: eligible
      ? 'You meet all criteria for seller verification'
      : 'You do not meet all criteria for seller verification',
  };
};

module.exports = {
  calculateReputation,
  getReputationHistory,
  checkVerificationEligibility,
};
