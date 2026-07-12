/**
 * Wraps an async route handler so any rejected promise is forwarded
 * to Express's error-handling middleware via next(), instead of
 * requiring a try/catch block in every controller.
 */
function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

module.exports = catchAsync;
