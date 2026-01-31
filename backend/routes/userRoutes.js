const express = require('express');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorize');
const { createUser, getMe, getAllUsers } = require('../controllers/userController');

const router = express.Router();

router.use(authenticateJWT);

router.post('/', authorizeRoles('admin', 'manager'), createUser);
router.get('/me', getMe);
router.get('/', authorizeRoles('admin'), getAllUsers);

module.exports = router;