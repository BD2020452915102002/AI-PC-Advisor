const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'product_service_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg)
};

// Additional options
const options = {
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // Adds createdAt and updatedAt to all models
    underscored: true, // Use snake_case for fields
    freezeTableName: false, // Use plural form for table names
  },
  // Disable logging in production
  logging: process.env.NODE_ENV === 'production' ? false : config.logging
};

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    ...options
  }
);

module.exports = { sequelize, Sequelize }; 