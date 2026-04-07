import express from 'express';
import authenticateJWT from '../middleware/auth.js';
import authorizeRoles from '../middleware/authorize.js';
import {
  getEmployeeQueries,
  createEmployeeQuery,
  getEmployeeUnreadCount,
  getManagerQueries,
  getManagerUnreadCount,
  replyToQuery,
} from '../controllers/queryController.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/employee', authorizeRoles('employee'), getEmployeeQueries);
router.get('/employee/unread-count', authorizeRoles('employee'), getEmployeeUnreadCount);
router.post('/employee', authorizeRoles('employee'), createEmployeeQuery);
router.get('/manager', authorizeRoles('manager'), getManagerQueries);
router.get('/manager/unread-count', authorizeRoles('manager'), getManagerUnreadCount);
router.post('/:id/reply', authorizeRoles('manager'), replyToQuery);

export default router;
