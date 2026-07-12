const AppError = require('../utils/AppError');

/**
 * Restricts access to a route based on the authenticated user's role.
 * Usage: router.delete('/:id', protect, restrictTo('admin'), handler)
 * Must run after the `protect` middleware, which sets req.user.
 */
function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before authorization can be checked.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not permitted to perform this action.`, 403)
      );
    }

    next();
  };
}

module.exports = restrictTo;
