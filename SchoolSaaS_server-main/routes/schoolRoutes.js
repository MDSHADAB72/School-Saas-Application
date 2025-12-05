import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool
} from '../controllers/schoolController.js';

const router = express.Router();

router.get('/', authenticate, getAllSchools);
router.get('/:id', authenticate, getSchoolById);
router.post('/', authenticate, authorize(['super_admin']), createSchool);
router.put('/:id', authenticate, authorize(['super_admin', 'school_admin']), updateSchool);
router.delete('/:id', authenticate, authorize(['super_admin']), deleteSchool);

export default router;
