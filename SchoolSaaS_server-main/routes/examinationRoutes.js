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
  approveResult,
  rejectResult,
  getPendingResults,
  getUpcomingExams,
  getMyExamSchedule,
  generateAdmitCard,
  checkAdmitCardEligibility,
  printResultCard
} from '../controllers/examinationController.js';

const router = express.Router();

router.get('/', authenticate, getAllExaminations);
router.get('/upcoming', authenticate, authorize(['student', 'parent']), getUpcomingExams);
router.get('/my-schedule', authenticate, authorize(['student', 'parent']), getMyExamSchedule);
router.get('/admit-card/eligibility', authenticate, authorize(['student', 'parent']), checkAdmitCardEligibility);
router.get('/admit-card/:examinationId', authenticate, authorize(['student', 'parent']), generateAdmitCard);
router.post('/', authenticate, authorize(['school_admin', 'exam_controller']), createExamination);
router.put('/:id', authenticate, authorize(['school_admin', 'exam_controller']), updateExamination);
router.put('/:id/status', authenticate, authorize(['school_admin', 'exam_controller']), updateExaminationStatus);
router.post('/results/submit', authenticate, authorize(['teacher', 'school_admin', 'exam_controller']), submitResult);
router.put('/results/:id/publish', authenticate, authorize(['teacher', 'school_admin', 'exam_controller']), publishResult);
router.put('/results/:id/approve', authenticate, authorize(['exam_controller', 'school_admin']), approveResult);
router.put('/results/:id/reject', authenticate, authorize(['exam_controller', 'school_admin']), rejectResult);
router.get('/results/pending', authenticate, authorize(['exam_controller', 'school_admin']), getPendingResults);
router.get('/results/my', authenticate, authorize(['student', 'parent']), getMyResults);
router.get('/results/student/:studentId', authenticate, getStudentResults);
router.get('/results/examination/:examinationId', authenticate, getExaminationResults);
router.get('/results/:id/print', authenticate, printResultCard);

export default router;
