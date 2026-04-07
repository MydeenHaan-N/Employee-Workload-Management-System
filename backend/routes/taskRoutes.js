import express from 'express';
import authenticateJWT from '../middleware/auth.js';
import authorizeRoles from '../middleware/authorize.js';
import { createTask, getMyTasks, updateTaskStatus } from '../controllers/taskController.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/', authorizeRoles('manager'), createTask);
router.get('/my', authorizeRoles('employee'), getMyTasks);
router.put('/:id/status', authorizeRoles('employee'), updateTaskStatus);

export default router;
