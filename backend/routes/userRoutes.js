const express = require('express');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorize');
const { createUser, getMe, getAllUsers, updateUser, deleteUser, getMyTeam } = require('../controllers/userController');

const router = express.Router();

router.use(authenticateJWT);

router.post('/', authorizeRoles('admin'), createUser);
router.get('/me', getMe);
router.get('/team', authorizeRoles('manager'), getMyTeam);
router.get('/', authorizeRoles('admin'), getAllUsers);

router.put('/:id', authorizeRoles('admin'), updateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

module.exports = router;
