const express = require('express');
const { adminAuth } = require('../../shared/middleware/auth.middleware');
const categoryController = require('./category.controller');

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/admin/all', adminAuth, categoryController.getAdminCategories);
router.post('/', adminAuth, categoryController.createCategory);
router.put('/:id', adminAuth, categoryController.updateCategory);
router.delete('/:id', adminAuth, categoryController.deleteCategory);

module.exports = router;
