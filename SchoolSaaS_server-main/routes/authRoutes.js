import express from 'express';
import { register, login, getCurrentUser, updateProfile, logout, registerSchool } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/register-school', registerSchool);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.post('/logout', authenticate, logout);

export default router;
