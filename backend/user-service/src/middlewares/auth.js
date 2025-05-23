const { initKeycloak } = require('../config/keycloak');
const { ApiError } = require('./errorHandler');
const logger = require('../utils/logger');

// Initialize Keycloak
const { keycloak } = initKeycloak();

/**
 * Middleware to check if user is authenticated via Keycloak
 */
const isAuthenticated = keycloak.protect();

/**
 * Middleware to check if user has required role
 * @param {string} role - The role to check for
 */
const hasRole = (role) => {
  return keycloak.protect((token) => {
    const hasAccess = token && token.hasRole(role);
    if (!hasAccess) {
      logger.warn(`Access denied: User lacks required role: ${role}`);
      throw new ApiError('You do not have permission to access this resource', 'ForbiddenError');
    }
    return hasAccess;
  });
};

/**
 * Middleware to extract user information from Keycloak token
 */
const extractUserInfo = (req, res, next) => {
  try {
    if (req.kauth && req.kauth.grant && req.kauth.grant.access_token) {
      const token = req.kauth.grant.access_token;
      
      // Extract user info from token
      req.user = {
        id: token.content.sub,
        email: token.content.email,
        name: token.content.name,
        preferred_username: token.content.preferred_username,
        roles: token.content.realm_access?.roles || []
      };
      
      logger.debug(`User authenticated: ${req.user.preferred_username}`);
    }
    next();
  } catch (error) {
    logger.error('Error extracting user info from token:', error);
    next(new ApiError('Error processing authentication information', 'AuthenticationError'));
  }
};

module.exports = {
  isAuthenticated,
  hasRole,
  extractUserInfo,
  keycloak
}; 