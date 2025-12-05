import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  getAllAssignments,
  createAssignment,
  submitAssignment,
  getSubmissions,
  getMySubmissions,
  gradeSubmission
} from '../controllers/assignmentController.js';

const router = express.Router();

router.get('/', authenticate, getAllAssignments);
router.post('/', authenticate, authorize(['teacher', 'school_admin']), upload.array('files', 10), createAssignment);
router.post('/submit', authenticate, authorize(['student', 'parent']), upload.array('files', 10), submitAssignment);
router.get('/my-submissions', authenticate, authorize(['student', 'parent']), getMySubmissions);
router.get('/:assignmentId/submissions', authenticate, authorize(['teacher', 'school_admin']), getSubmissions);
router.put('/submission/:id/grade', authenticate, authorize(['teacher', 'school_admin']), gradeSubmission);

export default router;
