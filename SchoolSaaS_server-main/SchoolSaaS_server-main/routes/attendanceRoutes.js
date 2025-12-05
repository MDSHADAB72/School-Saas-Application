import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getAllAttendance,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  getAttendanceReport
} from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/', authenticate, getAllAttendance);
router.post('/', authenticate, authorize(['teacher', 'school_admin']), markAttendance);
router.post('/bulk', authenticate, authorize(['teacher', 'school_admin']), bulkMarkAttendance);
router.put('/:id', authenticate, authorize(['teacher', 'school_admin']), updateAttendance);
router.get('/report/:studentId', authenticate, getAttendanceReport);

export default router;
