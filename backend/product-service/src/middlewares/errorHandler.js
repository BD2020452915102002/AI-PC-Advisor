const logger = require('../utils/logger');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, type = 'ServerError', details = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = 500;
  let errorType = 'ServerError';
  let errorMessage = 'Internal Server Error';
  let errorDetails = null;

  // Log the error
  logger.error(`Error: ${err.message}`, { 
    error: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    errorMessage = err.message;
    errorType = err.type;
    errorDetails = err.details;

    // Set status code based on error type
    switch (err.type) {
      case 'ValidationError':
        statusCode = 400;
        break;
      case 'AuthenticationError':
        statusCode = 401;
        break;
      case 'ForbiddenError':
        statusCode = 403;
        break;
      case 'NotFoundError':
        statusCode = 404;
        break;
      case 'ConflictError':
        statusCode = 409;
        break;
      default:
        statusCode = 500;
    }
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      type: errorType,
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

module.exports = {
  ApiError,
  errorHandler
}; 