const { Brand, Product } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { setAsync, getAsync } = require('../config/redis');
const { uploadImage, deleteImage } = require('../utils/imageUploader');

/**
 * Get all brands
 */
exports.getAllBrands = async (req, res, next) => {
  try {
    // Try to get from cache first
    const cacheKey = 'brands:all';
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 0; // 0 means no limit
    const offset = limit ? (page - 1) * limit : 0;
    
    // Filtering
    const filters = {};
    
    // Active status filter (default to active only)
    filters.isActive = req.query.includeInactive === 'true' ? undefined : true;
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    // Query options
    const options = {
      where: filters,
      order: [['name', 'ASC']]
    };
    
    // Apply pagination if limit is set
    if (limit) {
      options.limit = limit;
      options.offset = offset;
    }
    
    // Fetch brands
    let result;
    if (limit) {
      const { count, rows: brands } = await Brand.findAndCountAll(options);
      result = {
        brands,
        pagination: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          itemsPerPage: limit
        }
      };
    } else {
      const brands = await Brand.findAll(options);
      result = { brands };
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching brands:', error);
    next(new ApiError('Failed to fetch brands', 'ServerError', error.message));
  }
};

/**
 * Get brand by ID
 */
exports.getBrandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache first
    const cacheKey = `brand:${id}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const brand = await Brand.findByPk(id);
    
    if (!brand) {
      return next(new ApiError('Brand not found', 'NotFoundError'));
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(brand), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(brand);
  } catch (error) {
    logger.error(`Error fetching brand with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to fetch brand', 'ServerError', error.message));
  }
};

/**
 * Get brand by slug
 */
exports.getBrandBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Try to get from cache first
    const cacheKey = `brand:slug:${slug}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const brand = await Brand.findOne({ where: { slug } });
    
    if (!brand) {
      return next(new ApiError('Brand not found', 'NotFoundError'));
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(brand), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(brand);
  } catch (error) {
    logger.error(`Error fetching brand with slug ${req.params.slug}:`, error);
    next(new ApiError('Failed to fetch brand', 'ServerError', error.message));
  }
};

/**
 * Create a new brand
 */
exports.createBrand = async (req, res, next) => {
  try {
    const brandData = req.body;
    
    // Create brand
    const brand = await Brand.create(brandData);
    
    // Invalidate cache
    await setAsync('brands:all', '', 'EX', 1); // Expire immediately
    
    res.status(201).json(brand);
  } catch (error) {
    logger.error('Error creating brand:', error);
    next(new ApiError('Failed to create brand', 'ServerError', error.message));
  }
};

/**
 * Update a brand
 */
exports.updateBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find brand
    const brand = await Brand.findByPk(id);
    if (!brand) {
      return next(new ApiError('Brand not found', 'NotFoundError'));
    }
    
    // Update brand
    await brand.update(updateData);
    
    // Invalidate cache
    await setAsync(`brand:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`brand:slug:${brand.slug}`, '', 'EX', 1); // Expire immediately
    await setAsync('brands:all', '', 'EX', 1); // Expire immediately
    
    res.status(200).json(brand);
  } catch (error) {
    logger.error(`Error updating brand with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to update brand', 'ServerError', error.message));
  }
};

/**
 * Delete a brand
 */
exports.deleteBrand = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find brand
    const brand = await Brand.findByPk(id);
    if (!brand) {
      return next(new ApiError('Brand not found', 'NotFoundError'));
    }
    
    // Check if brand has products
    const productCount = await Product.count({ where: { brandId: id } });
    if (productCount > 0) {
      return next(new ApiError('Cannot delete brand with associated products', 'ValidationError'));
    }
    
    // Delete brand logo from Cloudinary if exists
    if (brand.logoUrl) {
      try {
        // Extract public ID from URL
        const publicId = brand.logoUrl.split('/').pop().split('.')[0];
        await deleteImage(`brands/${publicId}`);
      } catch (imageError) {
        logger.error(`Error deleting brand logo: ${imageError.message}`);
        // Continue with deletion even if image deletion fails
      }
    }
    
    // Delete brand
    await brand.destroy();
    
    // Invalidate cache
    await setAsync(`brand:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`brand:slug:${brand.slug}`, '', 'EX', 1); // Expire immediately
    await setAsync('brands:all', '', 'EX', 1); // Expire immediately
    
    res.status(200).json({ message: 'Brand deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting brand with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to delete brand', 'ServerError', error.message));
  }
};

/**
 * Upload brand logo
 */
exports.uploadBrandLogo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find brand
    const brand = await Brand.findByPk(id);
    if (!brand) {
      return next(new ApiError('Brand not found', 'NotFoundError'));
    }
    
    if (!req.file) {
      return next(new ApiError('No image file provided', 'ValidationError'));
    }
    
    // Delete old logo from Cloudinary if exists
    if (brand.logoUrl) {
      try {
        // Extract public ID from URL
        const publicId = brand.logoUrl.split('/').pop().split('.')[0];
        await deleteImage(`brands/${publicId}`);
      } catch (imageError) {
        logger.error(`Error deleting old brand logo: ${imageError.message}`);
        // Continue with upload even if old image deletion fails
      }
    }
    
    // Upload new logo to Cloudinary
    const imageResult = await uploadImage(req.file.buffer, 'brands');
    
    // Update brand with new logo URL
    await brand.update({ logoUrl: imageResult.url });
    
    // Invalidate cache
    await setAsync(`brand:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`brand:slug:${brand.slug}`, '', 'EX', 1); // Expire immediately
    await setAsync('brands:all', '', 'EX', 1); // Expire immediately
    
    res.status(200).json({ 
      message: 'Brand logo uploaded successfully',
      logoUrl: imageResult.url
    });
  } catch (error) {
    logger.error(`Error uploading logo for brand ${req.params.id}:`, error);
    next(new ApiError('Failed to upload brand logo', 'ServerError', error.message));
  }
}; 