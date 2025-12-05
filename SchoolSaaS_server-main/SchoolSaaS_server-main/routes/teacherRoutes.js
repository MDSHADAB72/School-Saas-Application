import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  bulkCreateTeachers,
  updateTeacher,
  deleteTeacher
} from '../controllers/teacherController.js';

const router = express.Router();

router.get('/', authenticate, getAllTeachers);
router.get('/:id', authenticate, getTeacherById);
router.post('/', authenticate, authorize(['school_admin']), createTeacher);
router.post('/bulk', authenticate, authorize(['school_admin']), bulkCreateTeachers);
router.put('/:id', authenticate, authorize(['school_admin']), updateTeacher);
router.delete('/:id', authenticate, authorize(['school_admin']), deleteTeacher);

export default router;
