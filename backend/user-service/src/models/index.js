const { Sequelize } = require('sequelize');
const config = require('../config/database');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create a Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging ? msg => logger.debug(msg) : false,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions
  }
);

// Initialize models
const User = require('./user')(sequelize);
const Profile = require('./profile')(sequelize);
const Address = require('./address')(sequelize);

// Define associations
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId' });

// Export the db object
const db = {
  sequelize,
  Sequelize,
  User,
  Profile,
  Address
};

module.exports = db; 