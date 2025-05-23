const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const { isAuthenticated, hasRole, extractUserInfo } = require('../middlewares/auth');
const { productValidationRules } = require('../middlewares/validator');

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit to 5MB
  }
});

// Public routes (no authentication required)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);

// Routes requiring authentication
router.post('/', 
  isAuthenticated, 
  extractUserInfo, 
  hasRole('admin'), 
  productValidationRules.create, 
  productController.createProduct
);

router.put('/:id', 
  isAuthenticated, 
  extractUserInfo, 
  hasRole('admin'), 
  productValidationRules.update, 
  productController.updateProduct
);

router.delete('/:id', 
  isAuthenticated, 
  extractUserInfo, 
  hasRole('admin'), 
  productController.deleteProduct
);

// Image upload routes
router.post('/:id/images', 
  isAuthenticated, 
  extractUserInfo, 
  hasRole('admin'), 
  upload.single('image'), 
  productController.uploadProductImage
);

router.delete('/:id/images/:imageId', 
  isAuthenticated, 
  extractUserInfo, 
  hasRole('admin'), 
  productController.deleteProductImage
);

// Specification routes
router.post('/:id/specifications', 
  isAuthenticated, 
  extractUserInfo, 
  hasRole('admin'), 
  productController.updateProductSpecifications
);

module.exports = router; 