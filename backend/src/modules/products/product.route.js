const express = require('express');
const upload = require('../../shared/middleware/upload.middleware');
const { userAuth } = require('../../shared/middleware/auth.middleware');
const productController = require('./product.controller');

const router = express.Router();

router.get('/', productController.listProducts);
router.get('/user/:userId', productController.getProductsByUser);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id', productController.getProduct);

router.post('/:id/reviews', userAuth, productController.addReview);
router.post('/:id/report', userAuth, productController.reportProduct);
router.post('/', userAuth, upload.array('images', 5), productController.createProduct);

router.put('/:id', userAuth, upload.array('images', 5), productController.updateProduct);
router.patch('/:id/status', userAuth, productController.updateProductStatus);

router.delete('/:id', userAuth, productController.deleteProduct);

module.exports = router;
