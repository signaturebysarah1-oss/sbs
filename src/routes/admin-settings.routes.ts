import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listSettings, updateSetting } from '../controllers/settings.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));

router.get('/', listSettings);
router.patch('/:key', updateSetting);

export default router;
