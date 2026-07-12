const AppError = require('../utils/AppError');

function handleCastError(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
}

function handleDuplicateFieldError(err) {
  const field = Object.keys(err.keyValue || {})[0];
  return new AppError(`Duplicate value for field '${field}'. Please use another value.`, 400);
}

function handleValidationError(err) {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data: ${messages.join('. ')}`, 400);
}

function handleJWTError() {
  return new AppError('Invalid token. Please log in again.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Your token has expired. Please log in again.', 401);
}

/**
 * Central error-handling middleware. Normalizes known Mongoose/JWT
 * errors into AppError instances, then returns a consistent JSON
 * error shape for every endpoint in the API.
 */
function errorHandler(err, req, res, next) {
  let error = err;
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateFieldError(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (!error.isOperational) {
    // Unexpected/programming error: log details, hide them from the client
    console.error('[UNEXPECTED ERROR]', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }

  return res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
  });
}

module.exports = errorHandler;
