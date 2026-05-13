const { computeProfileScore } = require('../../shared/utils/profileCompletion.utils');

const buildWishlistPayload = (user) => ({
  wishlist: (user.wishlist || []).map((item) => item.toString()),
  wishlistCount: user.wishlist?.length || 0,
});

const recalculateSellerReviewStats = (user) => {
  const reviewCount = user.reviews?.length || 0;
  const averageRating = reviewCount
    ? Number((user.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
    : 0;
  user.reviewCount = reviewCount;
  user.averageRating = averageRating;
};

const buildTrustLabels = (user, { completedOrders = 0, openReports = 0 } = {}) => {
  const labels = [];
  const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const score = computeProfileScore(user);

  if (score >= 80) labels.push({ key: 'profile_complete', label: 'Profile Complete', color: 'blue' });
  if (ageDays < 7) labels.push({ key: 'new_member', label: 'New Member', color: 'gray' });
  if (completedOrders >= 3 && user.averageRating >= 4.0 && openReports === 0) {
    labels.push({ key: 'trusted_seller', label: 'Trusted Seller', color: 'emerald' });
  }
  if (completedOrders >= 10 && user.averageRating >= 4.5) {
    labels.push({ key: 'top_rated', label: 'Top Rated', color: 'amber' });
  }
  if (user.role === 'admin') labels.push({ key: 'staff_verified', label: 'Staff Verified', color: 'purple' });

  return labels;
};

module.exports = {
  buildWishlistPayload,
  recalculateSellerReviewStats,
  buildTrustLabels,
};
