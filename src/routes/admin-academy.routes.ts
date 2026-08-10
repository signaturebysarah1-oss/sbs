import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getAdminAcademyApplication,
  listAdminAcademyApplications,
  updateAdminAcademyApplicationIsRead,
} from '../controllers/academy.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));
router.get('/applications', listAdminAcademyApplications);
router.get('/applications/:id', getAdminAcademyApplication);
router.patch('/applications/:id/is-read', updateAdminAcademyApplicationIsRead);

export default router;
