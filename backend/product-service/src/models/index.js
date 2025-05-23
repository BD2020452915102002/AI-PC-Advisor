const { sequelize, Sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import models
const Product = require('./product')(sequelize);
const Category = require('./category')(sequelize);
const Brand = require('./brand')(sequelize);
const ProductImage = require('./productImage')(sequelize);
const Specification = require('./specification')(sequelize);
const ProductSpecification = require('./productSpecification')(sequelize);

// Define associations
const setupAssociations = () => {
  // Product and Category (Many-to-One)
  Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
  Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
  
  // Category hierarchy (self-referential)
  Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });
  Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });
  
  // Product and Brand (Many-to-One)
  Product.belongsTo(Brand, { foreignKey: 'brandId', as: 'brand' });
  Brand.hasMany(Product, { foreignKey: 'brandId', as: 'products' });
  
  // Product and ProductImage (One-to-Many)
  Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' });
  ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  
  // Product and Specification (Many-to-Many)
  Product.belongsToMany(Specification, { 
    through: ProductSpecification,
    foreignKey: 'productId',
    otherKey: 'specificationId',
    as: 'specifications'
  });
  
  Specification.belongsToMany(Product, {
    through: ProductSpecification,
    foreignKey: 'specificationId',
    otherKey: 'productId',
    as: 'products'
  });
  
  logger.debug('Model associations established');
};

// Setup associations
setupAssociations();

// Export models and Sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  Product,
  Category,
  Brand,
  ProductImage,
  Specification,
  ProductSpecification
}; 