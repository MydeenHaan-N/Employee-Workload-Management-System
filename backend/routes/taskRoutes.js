import express from 'express';
import authenticateJWT from '../middleware/auth.js';
import authorizeRoles from '../middleware/authorize.js';
import {
  createTask,
  getManagerTaskBoard,
  assignTaskToEmployee,
  autoAssignBacklogTasks,
  getMyTasks,
  updateTaskStatus,
} from '../controllers/taskController.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/', authorizeRoles('manager'), createTask);
router.get('/manager-board', authorizeRoles('manager'), getManagerTaskBoard);
router.post('/auto-assign', authorizeRoles('manager'), autoAssignBacklogTasks);
router.post('/:id/assign', authorizeRoles('manager'), assignTaskToEmployee);
router.get('/my', authorizeRoles('employee'), getMyTasks);
router.put('/:id/status', authorizeRoles('employee'), updateTaskStatus);

export default router;
