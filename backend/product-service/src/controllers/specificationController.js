const { Specification, Category } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { setAsync, getAsync } = require('../config/redis');

/**
 * Get all specifications
 */
exports.getAllSpecifications = async (req, res, next) => {
  try {
    // Try to get from cache first
    const cacheKey = 'specifications:all';
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    // Query parameters
    const categoryId = req.query.categoryId;
    const isFilterable = req.query.isFilterable === 'true';
    const isComparable = req.query.isComparable === 'true';
    
    // Build query filters
    const filters = {};
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (isFilterable) {
      filters.isFilterable = true;
    }
    
    if (isComparable) {
      filters.isComparable = true;
    }
    
    const specifications = await Specification.findAll({
      where: filters,
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ],
      include: categoryId ? undefined : [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(specifications), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(specifications);
  } catch (error) {
    logger.error('Error fetching specifications:', error);
    next(new ApiError('Failed to fetch specifications', 'ServerError', error.message));
  }
};

/**
 * Get specification by ID
 */
exports.getSpecificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache first
    const cacheKey = `specification:${id}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const specification = await Specification.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });
    
    if (!specification) {
      return next(new ApiError('Specification not found', 'NotFoundError'));
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(specification), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(specification);
  } catch (error) {
    logger.error(`Error fetching specification with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to fetch specification', 'ServerError', error.message));
  }
};

/**
 * Create a new specification
 */
exports.createSpecification = async (req, res, next) => {
  try {
    const specificationData = req.body;
    
    // If categoryId is provided, check if category exists
    if (specificationData.categoryId) {
      const category = await Category.findByPk(specificationData.categoryId);
      if (!category) {
        return next(new ApiError('Category not found', 'ValidationError'));
      }
    }
    
    // Create specification
    const specification = await Specification.create(specificationData);
    
    // Invalidate cache
    await setAsync('specifications:all', '', 'EX', 1); // Expire immediately
    
    res.status(201).json(specification);
  } catch (error) {
    logger.error('Error creating specification:', error);
    next(new ApiError('Failed to create specification', 'ServerError', error.message));
  }
};

/**
 * Update a specification
 */
exports.updateSpecification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find specification
    const specification = await Specification.findByPk(id);
    if (!specification) {
      return next(new ApiError('Specification not found', 'NotFoundError'));
    }
    
    // If categoryId is provided, check if category exists
    if (updateData.categoryId) {
      const category = await Category.findByPk(updateData.categoryId);
      if (!category) {
        return next(new ApiError('Category not found', 'ValidationError'));
      }
    }
    
    // Update specification
    await specification.update(updateData);
    
    // Invalidate cache
    await setAsync(`specification:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync('specifications:all', '', 'EX', 1); // Expire immediately
    
    res.status(200).json(specification);
  } catch (error) {
    logger.error(`Error updating specification with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to update specification', 'ServerError', error.message));
  }
};

/**
 * Delete a specification
 */
exports.deleteSpecification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find specification
    const specification = await Specification.findByPk(id);
    if (!specification) {
      return next(new ApiError('Specification not found', 'NotFoundError'));
    }
    
    // Check if specification is used in products
    const productSpecCount = await specification.countProducts();
    if (productSpecCount > 0) {
      return next(new ApiError('Cannot delete specification that is used in products', 'ValidationError'));
    }
    
    // Delete specification
    await specification.destroy();
    
    // Invalidate cache
    await setAsync(`specification:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync('specifications:all', '', 'EX', 1); // Expire immediately
    
    res.status(200).json({ message: 'Specification deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting specification with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to delete specification', 'ServerError', error.message));
  }
};

/**
 * Get specifications by category
 */
exports.getSpecificationsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    
    // Try to get from cache first
    const cacheKey = `specifications:category:${categoryId}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    // Validate that category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return next(new ApiError('Category not found', 'NotFoundError'));
    }
    
    // Get specifications for this category
    const specifications = await Specification.findAll({
      where: { categoryId },
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    // Also get general specifications (not tied to any category)
    const generalSpecs = await Specification.findAll({
      where: { categoryId: null },
      order: [
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    const result = {
      categorySpecifications: specifications,
      generalSpecifications: generalSpecs
    };
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error(`Error fetching specifications for category ${req.params.categoryId}:`, error);
    next(new ApiError('Failed to fetch specifications', 'ServerError', error.message));
  }
};