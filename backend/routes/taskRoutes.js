const express = require('express');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorize');
const { createTask, getMyTasks, updateTaskStatus } = require('../controllers/taskController');

const router = express.Router();

router.use(authenticateJWT);

router.post('/', authorizeRoles('manager'), createTask);
router.get('/my', authorizeRoles('employee'), getMyTasks);
router.put('/:id/status', authorizeRoles('employee'), updateTaskStatus);

module.exports = router;