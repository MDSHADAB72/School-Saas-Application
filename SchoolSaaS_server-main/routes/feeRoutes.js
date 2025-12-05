import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getAllFees,
  createFee,
  updateFee,
  deleteFee,
  recordFeePayment,
  getFeeReport,
  generateFeesForAllStudents,
  printReceipt
} from '../controllers/feeController.js';

const router = express.Router();

router.get('/', authenticate, getAllFees);
router.post('/', authenticate, authorize(['school_admin']), createFee);
router.put('/:id', authenticate, authorize(['school_admin']), updateFee);
router.delete('/:id', authenticate, authorize(['school_admin']), deleteFee);
router.put('/:id/payment', authenticate, authorize(['school_admin', 'student', 'parent']), recordFeePayment);
router.get('/report/summary', authenticate, authorize(['school_admin']), getFeeReport);
router.post('/generate-all', authenticate, authorize(['school_admin']), generateFeesForAllStudents);
router.get('/:id/print', authenticate, printReceipt);

export default router;
