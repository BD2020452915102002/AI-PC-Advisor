const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuthenticated, hasRole, extractUserInfo } = require('../middlewares/auth');
const { categoryValidationRules } = require('../middlewares/validator');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Protected routes (admin only)
router.post('/',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  categoryValidationRules.create,
  categoryController.createCategory
);

router.put('/:id',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  categoryValidationRules.update,
  categoryController.updateCategory
);

router.delete('/:id',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  categoryController.deleteCategory
);

module.exports = router; 