require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const { initRedis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', routes.userRoutes);
app.use('/api/addresses', routes.addressRoutes);
app.use('/api/profiles', routes.profileRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'user-service' });
});

// Error handler middleware
app.use(errorHandler);

// Database connection, Redis initialization, and server start
const startServer = async () => {
  try {
    // Initialize database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Initialize Redis
    await initRedis();
    logger.info('Redis connection has been established successfully.');
    
    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized.');
    }
    
    app.listen(PORT, () => {
      logger.info(`User service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database/Redis or start server:', error);
    process.exit(1);
  }
};

startServer(); 