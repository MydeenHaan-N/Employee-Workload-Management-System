const express = require('express');
const authenticateJWT = require('../middleware/auth');
const { getEmployeeWorkload } = require('../controllers/workloadController');

const router = express.Router();

router.get('/workload', authenticateJWT, getEmployeeWorkload);

module.exports = router;