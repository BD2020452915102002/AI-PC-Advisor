const { Category, Product } = require('../models');
const { Op } = require('sequelize');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { setAsync, getAsync } = require('../config/redis');

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    // Try to get from cache first
    const cacheKey = 'categories:all';
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    // Query parameters
    const includeInactive = req.query.includeInactive === 'true';
    const includeProducts = req.query.includeProducts === 'true';
    const parentId = req.query.parentId || null;
    
    // Build query filters
    const filters = {};
    
    if (!includeInactive) {
      filters.isActive = true;
    }
    
    if (parentId === 'root') {
      filters.parentId = null;
    } else if (parentId) {
      filters.parentId = parentId;
    }
    
    // Build include options
    const include = [];
    if (includeProducts) {
      include.push({
        model: Product,
        as: 'products',
        attributes: ['id', 'name', 'slug', 'price'],
        where: { isActive: true },
        required: false
      });
    }
    
    const categories = await Category.findAll({
      where: filters,
      include,
      order: [
        ['level', 'ASC'],
        ['displayOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(categories), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(categories);
  } catch (error) {
    logger.error('Error fetching categories:', error);
    next(new ApiError('Failed to fetch categories', 'ServerError', error.message));
  }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache first
    const cacheKey = `category:${id}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { isActive: true },
          required: false
        },
        {
          model: Category,
          as: 'parent',
          required: false
        }
      ]
    });
    
    if (!category) {
      return next(new ApiError('Category not found', 'NotFoundError'));
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(category), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(category);
  } catch (error) {
    logger.error(`Error fetching category with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to fetch category', 'ServerError', error.message));
  }
};

/**
 * Get category by slug
 */
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Try to get from cache first
    const cacheKey = `category:slug:${slug}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const category = await Category.findOne({
      where: { slug },
      include: [
        {
          model: Category,
          as: 'subcategories',
          where: { isActive: true },
          required: false
        },
        {
          model: Category,
          as: 'parent',
          required: false
        }
      ]
    });
    
    if (!category) {
      return next(new ApiError('Category not found', 'NotFoundError'));
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(category), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(category);
  } catch (error) {
    logger.error(`Error fetching category with slug ${req.params.slug}:`, error);
    next(new ApiError('Failed to fetch category', 'ServerError', error.message));
  }
};

/**
 * Create a new category
 */
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = req.body;
    
    // If parentId is provided, check if parent exists
    if (categoryData.parentId) {
      const parentCategory = await Category.findByPk(categoryData.parentId);
      if (!parentCategory) {
        return next(new ApiError('Parent category not found', 'ValidationError'));
      }
    }
    
    // Create category
    const category = await Category.create(categoryData);
    
    // Invalidate cache
    await setAsync('categories:all', '', 'EX', 1); // Expire immediately
    
    res.status(201).json(category);
  } catch (error) {
    logger.error('Error creating category:', error);
    next(new ApiError('Failed to create category', 'ServerError', error.message));
  }
};

/**
 * Update a category
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      return next(new ApiError('Category not found', 'NotFoundError'));
    }
    
    // Prevent circular references
    if (updateData.parentId === id) {
      return next(new ApiError('A category cannot be its own parent', 'ValidationError'));
    }
    
    // If parentId is provided, check if parent exists
    if (updateData.parentId) {
      const parentCategory = await Category.findByPk(updateData.parentId);
      if (!parentCategory) {
        return next(new ApiError('Parent category not found', 'ValidationError'));
      }
      
      // Check that the new parent is not a descendant of this category
      if (await isDescendant(updateData.parentId, id)) {
        return next(new ApiError('Circular reference detected in category hierarchy', 'ValidationError'));
      }
    }
    
    // Update category
    await category.update(updateData);
    
    // Update path if parentId changed
    if (updateData.parentId !== undefined && updateData.parentId !== category.parentId) {
      if (!updateData.parentId) {
        // Now a root category
        await category.update({
          path: `/${category.slug}`,
          level: 1
        });
      } else {
        // Child category - find parent and build path
        const parent = await Category.findByPk(updateData.parentId);
        await category.update({
          path: `${parent.path}/${category.slug}`,
          level: parent.level + 1
        });
      }
      
      // Update paths of all descendants
      await updateDescendantPaths(category);
    }
    
    // Invalidate cache
    await setAsync(`category:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`category:slug:${category.slug}`, '', 'EX', 1); // Expire immediately
    await setAsync('categories:all', '', 'EX', 1); // Expire immediately
    
    res.status(200).json(category);
  } catch (error) {
    logger.error(`Error updating category with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to update category', 'ServerError', error.message));
  }
};

/**
 * Delete a category
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find category
    const category = await Category.findByPk(id);
    if (!category) {
      return next(new ApiError('Category not found', 'NotFoundError'));
    }
    
    // Check if category has subcategories
    const subcategories = await Category.count({ where: { parentId: id } });
    if (subcategories > 0) {
      return next(new ApiError('Cannot delete category with subcategories', 'ValidationError'));
    }
    
    // Check if category has products
    const products = await Product.count({ where: { categoryId: id } });
    if (products > 0) {
      return next(new ApiError('Cannot delete category with products', 'ValidationError'));
    }
    
    // Delete category
    await category.destroy();
    
    // Invalidate cache
    await setAsync(`category:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`category:slug:${category.slug}`, '', 'EX', 1); // Expire immediately
    await setAsync('categories:all', '', 'EX', 1); // Expire immediately
    
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting category with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to delete category', 'ServerError', error.message));
  }
};

/**
 * Helper function to check if a category is a descendant of another
 * @param {string} categoryId - Potential descendant
 * @param {string} ancestorId - Potential ancestor
 * @returns {Promise<boolean>} - True if categoryId is a descendant of ancestorId
 */
async function isDescendant(categoryId, ancestorId) {
  let current = await Category.findByPk(categoryId);
  
  while (current && current.parentId) {
    if (current.parentId === ancestorId) {
      return true;
    }
    current = await Category.findByPk(current.parentId);
  }
  
  return false;
}

/**
 * Helper function to update paths of all descendants when a category's path changes
 * @param {Object} category - The category whose descendants need updating
 */
async function updateDescendantPaths(category) {
  // Find all direct children
  const children = await Category.findAll({ where: { parentId: category.id } });
  
  for (const child of children) {
    // Update child path
    await child.update({
      path: `${category.path}/${child.slug}`,
      level: category.level + 1
    });
    
    // Recursively update grandchildren
    await updateDescendantPaths(child);
  }
} 