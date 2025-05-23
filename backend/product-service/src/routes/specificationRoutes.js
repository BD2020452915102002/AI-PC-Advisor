const express = require('express');
const router = express.Router();
const specificationController = require('../controllers/specificationController');
const { isAuthenticated, hasRole, extractUserInfo } = require('../middlewares/auth');

// Public routes
router.get('/', specificationController.getAllSpecifications);
router.get('/:id', specificationController.getSpecificationById);
router.get('/category/:categoryId', specificationController.getSpecificationsByCategory);

// Protected routes (admin only)
router.post('/',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  specificationController.createSpecification
);

router.put('/:id',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  specificationController.updateSpecification
);

router.delete('/:id',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  specificationController.deleteSpecification
);

module.exports = router; 