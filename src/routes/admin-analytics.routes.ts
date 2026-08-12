import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAdminAnalytics } from '../controllers/analytics.controller.js';
const router = Router();
router.use(requireAuth, requireRole('admin', 'super_admin'));
router.get('/', getAdminAnalytics);
export default router;
