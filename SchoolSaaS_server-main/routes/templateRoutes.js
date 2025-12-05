import express from 'express';
import {
  createTemplate,
  getTemplatesBySchool,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  renderTemplate,
  previewTemplate
} from '../controllers/templateController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Template CRUD routes
router.post('/', createTemplate);
router.get('/school/:schoolId', getTemplatesBySchool);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Template operations
router.post('/:id/set-default', setDefaultTemplate);
router.post('/render', renderTemplate);
router.post('/preview', previewTemplate);

export default router;