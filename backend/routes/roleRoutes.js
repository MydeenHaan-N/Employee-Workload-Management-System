import express from 'express';
import authenticateJWT from '../middleware/auth.js';
import authorizeRoles from '../middleware/authorize.js';
import { getAllRoles, createRole } from '../controllers/roleController.js';

const router = express.Router();

router.use(authenticateJWT);
router.get('/', authorizeRoles('admin'), getAllRoles);
router.post('/', authorizeRoles('admin'), createRole);

export default router;
