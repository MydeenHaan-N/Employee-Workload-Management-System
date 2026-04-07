import express from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import authenticateJWT from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);

export default router;
