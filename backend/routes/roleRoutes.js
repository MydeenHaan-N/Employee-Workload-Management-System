const express = require('express');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorize');
const { getAllRoles, createRole } = require('../controllers/roleController');

const router = express.Router();

router.use(authenticateJWT);
router.get('/', authorizeRoles('admin'), getAllRoles);
router.post('/', authorizeRoles('admin'), createRole);

module.exports = router;
