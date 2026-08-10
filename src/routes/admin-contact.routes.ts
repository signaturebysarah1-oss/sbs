import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAdminContactSubmission,
  listAdminContactSubmissions,
  updateAdminContactSubmissionIsRead,
} from '../controllers/contact.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));
router.get('/', listAdminContactSubmissions);
router.get('/:id', getAdminContactSubmission);
router.patch('/:id/is-read', updateAdminContactSubmissionIsRead);

export default router;
