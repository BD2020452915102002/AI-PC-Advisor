const { 
  Product, 
  Category, 
  Brand, 
  ProductImage,
  Specification,
  ProductSpecification 
} = require('../models');
const { Op } = require('sequelize');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { uploadImage, deleteImage } = require('../utils/imageUploader');
const { publishMessage } = require('../config/rabbitmq');
const { setAsync, getAsync } = require('../config/redis');

/**
 * Get all products with pagination and filtering
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Filtering
    const filters = {};
    
    // Active status filter (default to active only)
    filters.isActive = req.query.includeInactive === 'true' ? undefined : true;
    
    // Category filter
    if (req.query.categoryId) {
      filters.categoryId = req.query.categoryId;
    }
    
    // Brand filter
    if (req.query.brandId) {
      filters.brandId = req.query.brandId;
    }
    
    // Price range filter
    if (req.query.minPrice) {
      filters.price = { ...filters.price, [Op.gte]: parseFloat(req.query.minPrice) };
    }
    
    if (req.query.maxPrice) {
      filters.price = { ...filters.price, [Op.lte]: parseFloat(req.query.maxPrice) };
    }
    
    // Search filter
    if (req.query.search) {
      filters[Op.or] = [
        { name: { [Op.iLike]: `%${req.query.search}%` } },
        { description: { [Op.iLike]: `%${req.query.search}%` } }
      ];
    }
    
    // Special filters
    if (req.query.isHighlighted === 'true') {
      filters.isHighlighted = true;
    }
    
    if (req.query.isNew === 'true') {
      filters.isNew = true;
    }
    
    if (req.query.isOnSale === 'true') {
      filters.isOnSale = true;
    }
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    // Sorting
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // Try to get from cache first
    const cacheKey = `products:${page}:${limit}:${JSON.stringify(filters)}:${sortField}:${sortOrder}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    // Query database
    const { count, rows: products } = await Product.findAndCountAll({
      where: filters,
      limit,
      offset,
      order: [[sortField, sortOrder]],
      include: [
        { 
          model: Category, 
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        { 
          model: Brand, 
          as: 'brand',
          attributes: ['id', 'name', 'slug']
        },
        { 
          model: ProductImage, 
          as: 'images',
          where: { isMain: true },
          required: false,
          limit: 1
        }
      ],
      distinct: true
    });
    
    const totalPages = Math.ceil(count / limit);
    
    const result = {
      products,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    };
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(result), 'EX', 300); // Cache for 5 minutes
    }
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching products:', error);
    next(new ApiError('Failed to fetch products', 'ServerError', error.message));
  }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache first
    const cacheKey = `product:${id}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const product = await Product.findByPk(id, {
      include: [
        { 
          model: Category, 
          as: 'category'
        },
        { 
          model: Brand, 
          as: 'brand'
        },
        { 
          model: ProductImage, 
          as: 'images',
          order: [['position', 'ASC']]
        },
        {
          model: Specification,
          as: 'specifications',
          through: {
            model: ProductSpecification,
            as: 'productSpecifications',
            attributes: ['value', 'displayValue', 'isHighlighted']
          }
        }
      ]
    });
    
    if (!product) {
      return next(new ApiError('Product not found', 'NotFoundError'));
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(product), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(product);
  } catch (error) {
    logger.error(`Error fetching product with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to fetch product', 'ServerError', error.message));
  }
};

/**
 * Get product by slug
 */
exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Try to get from cache first
    const cacheKey = `product:slug:${slug}`;
    const cachedData = await getAsync(cacheKey);
    
    if (cachedData && process.env.NODE_ENV === 'production') {
      return res.status(200).json(JSON.parse(cachedData));
    }
    
    const product = await Product.findOne({
      where: { slug },
      include: [
        { 
          model: Category, 
          as: 'category'
        },
        { 
          model: Brand, 
          as: 'brand'
        },
        { 
          model: ProductImage, 
          as: 'images',
          order: [['position', 'ASC']]
        },
        {
          model: Specification,
          as: 'specifications',
          through: {
            model: ProductSpecification,
            as: 'productSpecifications',
            attributes: ['value', 'displayValue', 'isHighlighted']
          }
        }
      ]
    });
    
    if (!product) {
      return next(new ApiError('Product not found', 'NotFoundError'));
    }
    
    // Cache the result
    if (process.env.NODE_ENV === 'production') {
      await setAsync(cacheKey, JSON.stringify(product), 'EX', 3600); // Cache for 1 hour
    }
    
    res.status(200).json(product);
  } catch (error) {
    logger.error(`Error fetching product with slug ${req.params.slug}:`, error);
    next(new ApiError('Failed to fetch product', 'ServerError', error.message));
  }
};

/**
 * Create a new product
 */
exports.createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    
    // Validate that category exists
    const category = await Category.findByPk(productData.categoryId);
    if (!category) {
      return next(new ApiError('Category not found', 'ValidationError'));
    }
    
    // Validate that brand exists
    const brand = await Brand.findByPk(productData.brandId);
    if (!brand) {
      return next(new ApiError('Brand not found', 'ValidationError'));
    }
    
    // Create product
    const product = await Product.create(productData);
    
    // Publish message to RabbitMQ
    await publishMessage('product.created', {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      categoryId: product.categoryId,
      brandId: product.brandId
    });
    
    // Return created product
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    next(new ApiError('Failed to create product', 'ServerError', error.message));
  }
};

/**
 * Update a product
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find product
    const product = await Product.findByPk(id);
    if (!product) {
      return next(new ApiError('Product not found', 'NotFoundError'));
    }
    
    // Update product
    await product.update(updateData);
    
    // Invalidate cache
    await setAsync(`product:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`product:slug:${product.slug}`, '', 'EX', 1); // Expire immediately
    
    // Publish message to RabbitMQ
    await publishMessage('product.updated', {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      categoryId: product.categoryId,
      brandId: product.brandId
    });
    
    res.status(200).json(product);
  } catch (error) {
    logger.error(`Error updating product with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to update product', 'ServerError', error.message));
  }
};

/**
 * Delete a product
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find product
    const product = await Product.findByPk(id, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    
    if (!product) {
      return next(new ApiError('Product not found', 'NotFoundError'));
    }
    
    // Delete product images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await deleteImage(image.publicId);
      }
    }
    
    // Delete product
    await product.destroy();
    
    // Invalidate cache
    await setAsync(`product:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`product:slug:${product.slug}`, '', 'EX', 1); // Expire immediately
    
    // Publish message to RabbitMQ
    await publishMessage('product.deleted', {
      id: product.id
    });
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting product with ID ${req.params.id}:`, error);
    next(new ApiError('Failed to delete product', 'ServerError', error.message));
  }
};

/**
 * Upload product image
 */
exports.uploadProductImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate that product exists
    const product = await Product.findByPk(id);
    if (!product) {
      return next(new ApiError('Product not found', 'NotFoundError'));
    }
    
    if (!req.file) {
      return next(new ApiError('No image file provided', 'ValidationError'));
    }
    
    // Upload image to Cloudinary
    const imageResult = await uploadImage(req.file.buffer);
    
    // Determine if this is the main image
    const existingImages = await ProductImage.count({ where: { productId: id } });
    const isMain = existingImages === 0;
    
    // Create product image record
    const productImage = await ProductImage.create({
      productId: id,
      url: imageResult.url,
      publicId: imageResult.publicId,
      alt: req.body.alt || product.name,
      position: req.body.position || existingImages,
      width: imageResult.width,
      height: imageResult.height,
      isMain
    });
    
    // Invalidate cache
    await setAsync(`product:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`product:slug:${product.slug}`, '', 'EX', 1); // Expire immediately
    
    res.status(201).json(productImage);
  } catch (error) {
    logger.error(`Error uploading image for product ${req.params.id}:`, error);
    next(new ApiError('Failed to upload product image', 'ServerError', error.message));
  }
};

/**
 * Delete product image
 */
exports.deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    
    // Find product image
    const productImage = await ProductImage.findOne({
      where: {
        id: imageId,
        productId: id
      }
    });
    
    if (!productImage) {
      return next(new ApiError('Product image not found', 'NotFoundError'));
    }
    
    // Delete image from Cloudinary
    await deleteImage(productImage.publicId);
    
    // If this was the main image, set another image as main
    if (productImage.isMain) {
      const nextImage = await ProductImage.findOne({
        where: {
          productId: id,
          id: { [Op.ne]: imageId }
        },
        order: [['position', 'ASC']]
      });
      
      if (nextImage) {
        await nextImage.update({ isMain: true });
      }
    }
    
    // Delete product image record
    await productImage.destroy();
    
    // Invalidate cache
    await setAsync(`product:${id}`, '', 'EX', 1); // Expire immediately
    
    res.status(200).json({ message: 'Product image deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting image ${req.params.imageId} for product ${req.params.id}:`, error);
    next(new ApiError('Failed to delete product image', 'ServerError', error.message));
  }
};

/**
 * Add or update product specifications
 */
exports.updateProductSpecifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specifications } = req.body;
    
    if (!Array.isArray(specifications)) {
      return next(new ApiError('Specifications must be an array', 'ValidationError'));
    }
    
    // Validate that product exists
    const product = await Product.findByPk(id);
    if (!product) {
      return next(new ApiError('Product not found', 'NotFoundError'));
    }
    
    // Process each specification
    const results = [];
    for (const spec of specifications) {
      // Validate that specification exists
      const specification = await Specification.findByPk(spec.specificationId);
      if (!specification) {
        continue; // Skip invalid specifications
      }
      
      // Find or create product specification
      const [productSpec, created] = await ProductSpecification.findOrCreate({
        where: {
          productId: id,
          specificationId: spec.specificationId
        },
        defaults: {
          value: spec.value,
          isHighlighted: spec.isHighlighted || false
        }
      });
      
      // Update if not created
      if (!created) {
        await productSpec.update({
          value: spec.value,
          isHighlighted: spec.isHighlighted !== undefined ? spec.isHighlighted : productSpec.isHighlighted
        });
      }
      
      results.push(productSpec);
    }
    
    // Invalidate cache
    await setAsync(`product:${id}`, '', 'EX', 1); // Expire immediately
    await setAsync(`product:slug:${product.slug}`, '', 'EX', 1); // Expire immediately
    
    res.status(200).json(results);
  } catch (error) {
    logger.error(`Error updating specifications for product ${req.params.id}:`, error);
    next(new ApiError('Failed to update product specifications', 'ServerError', error.message));
  }
}; 