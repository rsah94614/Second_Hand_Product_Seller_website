/**
 * riskDetection.utils.js
 * Heuristics to compute a risk score (0-100) for listings and flag users.
 * Higher score = more suspicious. Does NOT auto-block; only signals admins.
 */

const Product = require('../../../models/Product');

// Categories considered high-value and higher-fraud-risk
const HIGH_RISK_CATEGORIES = ['Electronics', 'Mobile Phones', 'Laptops', 'Gadgets'];

// Price below this fraction of typical range triggers a flag
const SUSPICIOUSLY_LOW_PRICE_RATIO = 0.3;

/**
 * Rough reference price floors for high-risk categories (INR).
 * Used to detect "too cheap to be real" listings.
 * These are conservative minimums, not averages.
 */
const CATEGORY_PRICE_FLOORS = {
  'Electronics': 500,
  'Mobile Phones': 1000,
  'Laptops': 5000,
  'Gadgets': 300,
};

/**
 * Compute a Levenshtein distance ratio between two strings.
 * Returns a value 0..1. 1 = identical.
 */
function similarityRatio(a, b) {
  if (!a || !b) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;

  const costs = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter[i - 1] !== longer[j - 1]) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }

  const editDistance = costs[longer.length];
  return (longer.length - editDistance) / parseFloat(longer.length);
}

/**
 * Detect if a seller already has a suspiciously similar active listing.
 * Returns true if duplicate detected.
 */
async function hasDuplicateListing(sellerId, title, excludeProductId = null) {
  try {
    const query = { seller: sellerId, isActive: true, isSold: false };
    if (excludeProductId) query._id = { $ne: excludeProductId };

    const existingListings = await Product.find(query).select('title').limit(20).lean();

    return existingListings.some((listing) => {
      const ratio = similarityRatio(
        title.toLowerCase().trim(),
        listing.title.toLowerCase().trim()
      );
      return ratio > 0.85; // 85% similar = likely duplicate
    });
  } catch {
    return false;
  }
}

/**
 * Main heuristic function.
 * Returns { riskScore: Number, riskFlags: String[], reasons: String[] }
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.category
 * @param {number} params.price
 * @param {number} params.sellerAccountAgeDays  — days since account created
 * @param {number} params.sellerOpenReports     — count of open/reviewed reports on seller
 * @param {number} params.sellerActiveListings  — current active listing count
 * @param {string} params.sellerId
 * @param {string} [params.excludeProductId]    — for updates, skip self
 */
async function detectSuspiciousListing({
  title,
  category,
  price,
  sellerAccountAgeDays,
  sellerOpenReports = 0,
  sellerActiveListings = 0,
  sellerId,
  excludeProductId = null,
}) {
  let score = 0;
  const flags = [];
  const reasons = [];

  // 1. New account + high-risk category + very low price
  const isHighRisk = HIGH_RISK_CATEGORIES.includes(category);
  const priceFloor = CATEGORY_PRICE_FLOORS[category] || 0;
  const isSuspiciouslyLow = priceFloor > 0 && price < priceFloor * SUSPICIOUSLY_LOW_PRICE_RATIO;

  if (sellerAccountAgeDays < 7 && isHighRisk) {
    score += 25;
    flags.push('new_account_risk');
    reasons.push('New seller listing high-risk category item');
  }

  if (isHighRisk && isSuspiciouslyLow) {
    score += 30;
    flags.push('fake_price');
    reasons.push(`Price ₹${price} is suspiciously low for category "${category}"`);
  }

  // 2. Seller has open reports
  if (sellerOpenReports >= 3) {
    score += 30;
    flags.push('repeated_reports');
    reasons.push(`Seller has ${sellerOpenReports} open reports`);
  } else if (sellerOpenReports >= 1) {
    score += 10;
  }

  // 3. Too many listings for a new account
  if (sellerAccountAgeDays < 7 && sellerActiveListings >= 5) {
    score += 20;
    flags.push('spam_listing');
    reasons.push('New account creating many listings quickly');
  }

  // 4. Duplicate listing detection
  if (sellerId) {
    const isDuplicate = await hasDuplicateListing(sellerId, title, excludeProductId);
    if (isDuplicate) {
      score += 20;
      flags.push('spam_listing');
      reasons.push('Very similar listing already exists from this seller');
    }
  }

  return {
    riskScore: Math.min(score, 100),
    riskFlags: [...new Set(flags)],
    reasons,
  };
}

/**
 * Compute a user risk score based on their behaviour.
 * Called on admin suspicious-users endpoint.
 */
function computeUserRiskScore(user, { openReportCount = 0, cancellationCount = 0 } = {}) {
  let score = 0;

  if (openReportCount >= 3) score += 30;
  else if (openReportCount >= 1) score += 10;

  if (cancellationCount >= 5) score += 20;
  else if (cancellationCount >= 3) score += 10;

  const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays < 3) score += 15;

  if (user.isSuspended) score += 40;
  if (user.riskFlags?.length > 0) score += user.riskFlags.length * 5;

  return Math.min(score, 100);
}

module.exports = {
  detectSuspiciousListing,
  computeUserRiskScore,
  hasDuplicateListing,
  similarityRatio,
  HIGH_RISK_CATEGORIES,
};
