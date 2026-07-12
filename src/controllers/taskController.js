const Task = require('../models/Task');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { isValidTransition } = require('../utils/taskStatus');

/**
 * POST /api/tasks
 * Any authenticated user can create a task. It's owned by its creator
 * until assigned to someone else.
 */
const createTask = catchAsync(async (req, res, next) => {
  const { title, description, priority, dueDate, assignedTo } = req.body;

  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return next(new AppError('assignedTo does not reference an existing user.', 400));
    }
  }

  const task = await Task.create({
    title,
    description,
    priority,
    dueDate,
    assignedTo: assignedTo || null,
    createdBy: req.user._id,
  });

  res.status(201).json({ status: 'success', data: { task } });
});

/**
 * GET /api/tasks
 * Admins see every task. Members only see tasks they created or are
 * assigned to, so one member can't browse another's workload.
 */
const getTasks = catchAsync(async (req, res, next) => {
  const filter = {};

  if (req.user.role !== 'admin') {
    filter.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo && req.user.role === 'admin') filter.assignedTo = req.query.assignedTo;

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role')
    .sort('-createdAt');

  res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
});

/**
 * GET /api/tasks/:id
 */
const getTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role');

  if (!task) {
    return next(new AppError('No task found with that ID.', 404));
  }

  const isOwnerOrAssignee =
    task.createdBy._id.equals(req.user._id) ||
    (task.assignedTo && task.assignedTo._id.equals(req.user._id));

  if (req.user.role !== 'admin' && !isOwnerOrAssignee) {
    return next(new AppError('You do not have permission to view this task.', 403));
  }

  res.status(200).json({ status: 'success', data: { task } });
});

/**
 * PATCH /api/tasks/:id/assign
 * Admin-only: assign (or reassign) a task to a member.
 */
const assignTask = catchAsync(async (req, res, next) => {
  const { assignedTo } = req.body;

  const assignee = await User.findById(assignedTo);
  if (!assignee) {
    return next(new AppError('assignedTo does not reference an existing user.', 400));
  }

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { assignedTo },
    { new: true, runValidators: true }
  ).populate('assignedTo', 'name email role');

  if (!task) {
    return next(new AppError('No task found with that ID.', 404));
  }

  res.status(200).json({ status: 'success', data: { task } });
});

/**
 * PATCH /api/tasks/:id/status
 * Only the assignee, the creator, or an admin can move a task's status,
 * and only along an allowed transition (see utils/taskStatus.js).
 */
const updateStatus = catchAsync(async (req, res, next) => {
  const { status: nextStatus } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(new AppError('No task found with that ID.', 404));
  }

  const isOwnerOrAssignee =
    task.createdBy.equals(req.user._id) ||
    (task.assignedTo && task.assignedTo.equals(req.user._id));

  if (req.user.role !== 'admin' && !isOwnerOrAssignee) {
    return next(new AppError('You do not have permission to update this task.', 403));
  }

  if (!isValidTransition(task.status, nextStatus)) {
    return next(
      new AppError(`Cannot transition task from '${task.status}' to '${nextStatus}'.`, 400)
    );
  }

  task.status = nextStatus;
  await task.save();

  res.status(200).json({ status: 'success', data: { task } });
});

/**
 * DELETE /api/tasks/:id
 * Admin-only.
 */
const deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    return next(new AppError('No task found with that ID.', 404));
  }

  res.status(204).json({ status: 'success', data: null });
});

module.exports = { createTask, getTasks, getTask, assignTask, updateStatus, deleteTask };
