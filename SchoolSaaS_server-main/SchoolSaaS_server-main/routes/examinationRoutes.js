import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getAllExaminations,
  createExamination,
  updateExamination,
  submitResult,
  getStudentResults,
  getMyResults,
  getExaminationResults,
  updateExaminationStatus,
  publishResult,
  getUpcomingExams,
  getMyExamSchedule,
  generateAdmitCard,
  checkAdmitCardEligibility
} from '../controllers/examinationController.js';

const router = express.Router();

router.get('/', authenticate, getAllExaminations);
router.get('/upcoming', authenticate, authorize(['student', 'parent']), getUpcomingExams);
router.get('/my-schedule', authenticate, authorize(['student', 'parent']), getMyExamSchedule);
router.get('/admit-card/eligibility', authenticate, authorize(['student', 'parent']), checkAdmitCardEligibility);
router.get('/admit-card/:examinationId', authenticate, authorize(['student', 'parent']), generateAdmitCard);
router.post('/', authenticate, authorize(['school_admin']), createExamination);
router.put('/:id', authenticate, authorize(['school_admin']), updateExamination);
router.put('/:id/status', authenticate, authorize(['school_admin']), updateExaminationStatus);
router.post('/results/submit', authenticate, authorize(['teacher', 'school_admin']), submitResult);
router.put('/results/:id/publish', authenticate, authorize(['teacher', 'school_admin']), publishResult);
router.get('/results/my', authenticate, authorize(['student', 'parent']), getMyResults);
router.get('/results/student/:studentId', authenticate, getStudentResults);
router.get('/results/examination/:examinationId', authenticate, getExaminationResults);

export default router;
