const TASK_STATUSES = ['todo', 'in-progress', 'blocked', 'done'];

/**
 * Defines which status transitions are legal. A task can only move
 * to one of the statuses listed for its current status. This is
 * enforced in the controller before any status update is persisted.
 */
const ALLOWED_TRANSITIONS = {
  todo: ['in-progress'],
  'in-progress': ['blocked', 'done', 'todo'],
  blocked: ['in-progress'],
  done: [], // done is a terminal state; reopen by creating a new task
};

function isValidTransition(currentStatus, nextStatus) {
  if (!TASK_STATUSES.includes(nextStatus)) return false;
  if (currentStatus === nextStatus) return true; // no-op update is fine
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

module.exports = { TASK_STATUSES, ALLOWED_TRANSITIONS, isValidTransition };
