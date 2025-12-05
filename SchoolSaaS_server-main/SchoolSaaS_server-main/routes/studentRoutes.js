import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';

const router = express.Router();

router.get('/', authenticate, getAllStudents);
router.get('/:id', authenticate, getStudentById);
router.post('/', authenticate, authorize(['school_admin']), createStudent);
router.post('/bulk', authenticate, authorize(['school_admin']), bulkCreateStudents);
router.put('/:id', authenticate, authorize(['school_admin']), updateStudent);
router.delete('/:id', authenticate, authorize(['school_admin']), deleteStudent);

export default router;
