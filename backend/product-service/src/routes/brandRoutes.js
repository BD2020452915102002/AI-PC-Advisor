const express = require('express');
const router = express.Router();
const multer = require('multer');
const brandController = require('../controllers/brandController');
const { isAuthenticated, hasRole, extractUserInfo } = require('../middlewares/auth');
const { brandValidationRules } = require('../middlewares/validator');

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // limit to 2MB
  }
});

// Public routes
router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);
router.get('/slug/:slug', brandController.getBrandBySlug);

// Protected routes (admin only)
router.post('/',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  brandValidationRules.create,
  brandController.createBrand
);

router.put('/:id',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  brandValidationRules.update,
  brandController.updateBrand
);

router.delete('/:id',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  brandController.deleteBrand
);

// Logo upload route
router.post('/:id/logo',
  isAuthenticated,
  extractUserInfo,
  hasRole('admin'),
  upload.single('logo'),
  brandController.uploadBrandLogo
);

module.exports = router; 