import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { logActivity, getActivities } from '../controllers/activityController.js';

const router = express.Router();

router.post('/', authenticate, logActivity);
router.get('/', authenticate, getActivities);

export default router;
