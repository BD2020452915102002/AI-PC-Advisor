const { ApiError } = require('./errorHandler');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

/**
 * Middleware to extract token information
 */
const extractTokenInfo = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Decode token (but don't verify - that's handled by Keycloak)
      // This is just to extract basic info for logging/tracking
      const decoded = jwt.decode(token);
      
      if (decoded) {
        req.user = {
          id: decoded.sub,
          username: decoded.preferred_username,
          email: decoded.email,
          roles: decoded.realm_access?.roles || []
        };
        
        logger.debug(`User authenticated: ${req.user.username}`);
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error extracting token info:', error);
    next();
  }
};

/**
 * Middleware to add request ID for tracking
 */
const addRequestId = (req, res, next) => {
  req.id = Date.now().toString() + Math.random().toString(36).substring(2, 10);
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Middleware to handle service health check requests
 */
const serviceHealthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return res.status(200).json({ status: 'UP', service: 'api-gateway' });
  }
  next();
};

module.exports = {
  extractTokenInfo,
  addRequestId,
  serviceHealthCheck
}; 