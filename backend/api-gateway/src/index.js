require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { rateLimit } = require('express-rate-limit');
const { initKeycloak } = require('./config/keycloak');
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const routes = require('./routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Keycloak
const { keycloak, memoryStore, sessionConfig } = initKeycloak();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); 

// Session setup for Keycloak
app.use(require('express-session')(sessionConfig));
app.use(keycloak.middleware());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// API routes
app.use('/api', routes);

// Service proxy routes
// User Service
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  onError: (err, req, res) => {
    logger.error(`Proxy error to User Service: ${err.message}`);
    res.status(502).json({
      error: {
        type: 'ProxyError',
        message: 'Service unavailable',
        details: process.env.NODE_ENV === 'development' ? err.message : null
      }
    });
  }
}));

// Product Service
app.use('/api/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/api/products'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  onError: (err, req, res) => {
    logger.error(`Proxy error to Product Service: ${err.message}`);
    res.status(502).json({
      error: {
        type: 'ProxyError',
        message: 'Service unavailable',
        details: process.env.NODE_ENV === 'development' ? err.message : null
      }
    });
  }
}));

// Categories, Brands, Specifications from Product Service
app.use('/api/categories', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/categories': '/api/categories'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000
}));

app.use('/api/brands', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/brands': '/api/brands'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000
}));

app.use('/api/specifications', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/specifications': '/api/specifications'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000
}));

// Cart Service
app.use('/api/cart', createProxyMiddleware({
  target: process.env.CART_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/cart': '/api/cart'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  onError: (err, req, res) => {
    logger.error(`Proxy error to Cart Service: ${err.message}`);
    res.status(502).json({
      error: {
        type: 'ProxyError',
        message: 'Service unavailable',
        details: process.env.NODE_ENV === 'development' ? err.message : null
      }
    });
  }
}));

// Order Service
app.use('/api/orders', createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  },
  timeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  proxyTimeout: parseInt(process.env.SERVICE_TIMEOUT) || 5000,
  onError: (err, req, res) => {
    logger.error(`Proxy error to Order Service: ${err.message}`);
    res.status(502).json({
      error: {
        type: 'ProxyError',
        message: 'Service unavailable',
        details: process.env.NODE_ENV === 'development' ? err.message : null
      }
    });
  }
}));

// Error handler middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  // Consider a graceful shutdown here
  // process.exit(1);
}); 