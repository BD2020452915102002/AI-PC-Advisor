const express = require('express');
const router = express.Router();
const { addRequestId, extractTokenInfo, serviceHealthCheck } = require('../middlewares/authMiddleware');
const { ApiError } = require('../middlewares/errorHandler');

// Apply common middlewares
router.use(addRequestId);
router.use(extractTokenInfo);
router.use(serviceHealthCheck);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// API Info route
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'AI-PC-Advisor API Gateway',
    version: '1.0.0',
    description: 'API Gateway for AI-PC-Advisor E-commerce Platform',
    timestamp: new Date().toISOString(),
    services: [
      { name: 'User Service', path: '/api/users' },
      { name: 'Product Service', path: '/api/products' },
      { name: 'Category Service', path: '/api/categories' },
      { name: 'Brand Service', path: '/api/brands' },
      { name: 'Specification Service', path: '/api/specifications' },
      { name: 'Cart Service', path: '/api/cart' },
      { name: 'Order Service', path: '/api/orders' }
    ]
  });
});

// Catch 404 and forward to error handler
router.use((req, res, next) => {
  next(new ApiError('Route not found', 'NotFoundError'));
});

module.exports = router; 