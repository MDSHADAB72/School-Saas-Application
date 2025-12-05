import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';

const router = express.Router();

router.get('/', authenticate, getAllAnnouncements);
router.post('/', authenticate, authorize(['school_admin', 'teacher']), createAnnouncement);
router.put('/:id', authenticate, authorize(['school_admin']), updateAnnouncement);
router.delete('/:id', authenticate, authorize(['school_admin']), deleteAnnouncement);

export default router;
