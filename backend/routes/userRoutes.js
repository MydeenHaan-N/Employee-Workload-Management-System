const express = require('express');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorize');
const {
  createUser,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  getMyTeam,
  getAvailableEmployees,
  claimEmployee,
  releaseEmployee,
} = require('../controllers/userController');

const router = express.Router();

router.use(authenticateJWT);

router.post('/', authorizeRoles('admin'), createUser);
router.get('/me', getMe);
router.get('/available', authorizeRoles('manager'), getAvailableEmployees);
router.get('/team', authorizeRoles('manager'), getMyTeam);
router.get('/', authorizeRoles('admin'), getAllUsers);
router.post('/:id/claim', authorizeRoles('manager'), claimEmployee);
router.post('/:id/release', authorizeRoles('manager'), releaseEmployee);

router.put('/:id', authorizeRoles('admin'), updateUser);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

module.exports = router;
