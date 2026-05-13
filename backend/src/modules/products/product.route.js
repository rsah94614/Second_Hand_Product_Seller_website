const express = require('express');
const upload = require('../../shared/middleware/upload.middleware');
const { userAuth } = require('../../shared/middleware/auth.middleware');
const { enforceProfileRequired, enforceNewUserListingCap } = require('../../shared/middleware/newUser.middleware');
const { listingCreateLimiter, reportLimiter } = require('../../shared/middleware/rateLimiter.middleware');
const listingController = require('./controllers/listing.controller');
const searchController = require('./controllers/search.controller');
const managementController = require('./controllers/management.controller');
const analyticsController = require('./controllers/analytics.controller');

const router = express.Router();

router.get('/', searchController.listProducts);
router.get('/user/:userId', searchController.getProductsByUser);
router.get('/analytics/summary', userAuth, analyticsController.getSellerAnalyticsSummary);
router.get('/:id/related', searchController.getRelatedProducts);
router.get('/:id/analytics', userAuth, analyticsController.getProductAnalytics);
router.get('/:id', searchController.getProduct);

router.post('/:id/report', userAuth, reportLimiter, managementController.reportProduct);
router.post(
  '/',
  userAuth,
  enforceProfileRequired,
  enforceNewUserListingCap,
  listingCreateLimiter,
  upload.array('images', 5),
  listingController.createProduct
);
router.post('/:id/relist', userAuth, listingController.relistProduct);

router.put('/:id', userAuth, upload.array('images', 5), listingController.updateProduct);
router.patch('/:id/status', userAuth, managementController.updateProductStatus);

router.delete('/:id', userAuth, listingController.deleteProduct);

module.exports = router;
