const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { TASK_STATUSES } = require('../utils/taskStatus');

/**
 * Runs after any express-validator chain(s) and forwards a formatted
 * 400 error to the central error handler if validation failed.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`);
    return next(new AppError(`Validation failed - ${messages.join('; ')}`, 400));
  }
  next();
}

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const createTaskRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid date'),
  body('assignedTo').optional().isMongoId().withMessage('assignedTo must be a valid user ID'),
];

const updateStatusRules = [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('status').isIn(TASK_STATUSES).withMessage(`status must be one of: ${TASK_STATUSES.join(', ')}`),
];

const assignTaskRules = [
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('assignedTo').isMongoId().withMessage('assignedTo must be a valid user ID'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createTaskRules,
  updateStatusRules,
  assignTaskRules,
};
