/**
 * Custom application error class. Thrown for any expected/operational
 * error (validation failures, auth failures, not-found, etc.) so the
 * central error-handling middleware can format a consistent response.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
