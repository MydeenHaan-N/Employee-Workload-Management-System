import express from 'express';
import authenticateJWT from '../middleware/auth.js';
import { getEmployeeWorkload } from '../controllers/workloadController.js';

const router = express.Router();

router.get('/workload', authenticateJWT, getEmployeeWorkload);

export default router;
