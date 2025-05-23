const logger = require('../utils/logger');

// List of error types and their corresponding status codes
const errorTypes = {
  ValidationError: 400,
  AuthenticationError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  ServerError: 500
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, type = 'ServerError', details = null) {
    super(message);
    this.name = type;
    this.details = details;
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  logger.error(`${err.name}: ${err.message}`);
  if (err.details) {
    logger.debug(`Error details: ${JSON.stringify(err.details)}`);
  }
  
  // Get the status code based on error type or default to 500
  const statusCode = errorTypes[err.name] || 500;
  
  // Error response format
  const errorResponse = {
    error: {
      message: err.message || 'Internal Server Error',
      type: err.name || 'ServerError'
    }
  };
  
  // Include error details in non-production environments
  if (err.details && process.env.NODE_ENV !== 'production') {
    errorResponse.error.details = err.details;
  }
  
  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

module.exports = {
  errorHandler,
  ApiError
}; 