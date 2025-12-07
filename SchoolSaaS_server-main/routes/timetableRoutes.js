import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createPeriodConfiguration,
  getPeriodConfigurations,
  getActivePeriodConfiguration,
  updatePeriodConfiguration,
  deletePeriodConfiguration,
  getTeachersForTimetable,
  detectTimetableConflicts,
  validateTimetable
} from '../controllers/timetableController.js';

const router = express.Router();

router.use(authenticate);

// Period Configuration routes
router.post('/period-config', createPeriodConfiguration);
router.get('/period-config', getPeriodConfigurations);
router.get('/period-config/:academicYear', getActivePeriodConfiguration);
router.put('/period-config/:id', updatePeriodConfiguration);
router.delete('/period-config/:id', deletePeriodConfiguration);

// Get teachers for dropdown
router.get('/teachers', getTeachersForTimetable);

// Conflict detection
router.get('/conflicts/:academicYear', detectTimetableConflicts);

// Validate timetable
router.post('/validate', validateTimetable);

export default router;