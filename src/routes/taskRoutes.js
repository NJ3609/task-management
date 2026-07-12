const express = require('express');
const protect = require('../middleware/auth');
const restrictTo = require('../middleware/rbac');
const {
  createTask,
  getTasks,
  getTask,
  assignTask,
  updateStatus,
  deleteTask,
} = require('../controllers/taskController');
const {
  validate,
  createTaskRules,
  updateStatusRules,
  assignTaskRules,
} = require('../middleware/validators');

const router = express.Router();

// Every route below requires a valid, logged-in user
router.use(protect);

router.route('/').get(getTasks).post(createTaskRules, validate, createTask);

router
  .route('/:id')
  .get(getTask)
  .delete(restrictTo('admin'), deleteTask);

router.patch('/:id/assign', restrictTo('admin'), assignTaskRules, validate, assignTask);
router.patch('/:id/status', updateStatusRules, validate, updateStatus);

module.exports = router;
