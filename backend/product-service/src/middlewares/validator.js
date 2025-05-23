const { validationResult, check } = require('express-validator');
const { ApiError } = require('./errorHandler');

/**
 * Apply validation results middleware
 */
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg
    }));
    
    return next(new ApiError('Validation failed', 'ValidationError', validationErrors));
  }
  next();
};

/**
 * Product validation rules
 */
const productValidationRules = {
  create: [
    check('name')
      .notEmpty().withMessage('Product name is required')
      .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters'),
    check('description')
      .notEmpty().withMessage('Product description is required')
      .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    check('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    check('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    check('categoryId')
      .notEmpty().withMessage('Category ID is required'),
    check('brandId')
      .notEmpty().withMessage('Brand ID is required'),
    check('sku')
      .optional()
      .isString().withMessage('SKU must be a string')
      .isLength({ min: 3, max: 50 }).withMessage('SKU must be between 3 and 50 characters'),
    validateResults
  ],
  update: [
    check('name')
      .optional()
      .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters'),
    check('description')
      .optional()
      .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    check('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    check('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    check('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean'),
    check('categoryId')
      .optional(),
    check('brandId')
      .optional(),
    validateResults
  ]
};

/**
 * Category validation rules
 */
const categoryValidationRules = {
  create: [
    check('name')
      .notEmpty().withMessage('Category name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters'),
    check('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    check('parentId')
      .optional(),
    validateResults
  ],
  update: [
    check('name')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters'),
    check('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    check('parentId')
      .optional(),
    check('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean'),
    validateResults
  ]
};

/**
 * Brand validation rules
 */
const brandValidationRules = {
  create: [
    check('name')
      .notEmpty().withMessage('Brand name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Brand name must be between 2 and 50 characters'),
    check('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    check('website')
      .optional()
      .isURL().withMessage('Website must be a valid URL'),
    validateResults
  ],
  update: [
    check('name')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Brand name must be between 2 and 50 characters'),
    check('description')
      .optional()
      .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    check('website')
      .optional()
      .isURL().withMessage('Website must be a valid URL'),
    check('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be a boolean'),
    validateResults
  ]
};

module.exports = {
  validateResults,
  productValidationRules,
  categoryValidationRules,
  brandValidationRules
}; 