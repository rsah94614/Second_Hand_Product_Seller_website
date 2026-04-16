const express = require('express');
const upload = require('../../shared/middleware/upload.middleware');
const { userAuth } = require('../../shared/middleware/auth.middleware');
const { enforceProfileRequired, enforceNewUserListingCap } = require('../../shared/middleware/newUser.middleware');
const { listingCreateLimiter, reportLimiter } = require('../../shared/middleware/rateLimiter.middleware');
const productController = require('./product.controller');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/user/:userId', productController.getProductsByUser);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id', productController.getProduct);

router.post('/:id/report', userAuth, reportLimiter, productController.reportProduct);
router.post(
  '/',
  userAuth,
  enforceProfileRequired,
  enforceNewUserListingCap,
  listingCreateLimiter,
  upload.array('images', 5),
  productController.createProduct
);
router.post('/:id/relist', userAuth, productController.relistProduct);

router.put('/:id', userAuth, upload.array('images', 5), productController.updateProduct);
router.patch('/:id/status', userAuth, productController.updateProductStatus);

router.delete('/:id', userAuth, productController.deleteProduct);

module.exports = router;
