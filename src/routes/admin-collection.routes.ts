import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createAdminCollection,
  deleteAdminCollection,
  updateAdminCollection,
} from '../controllers/collection.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));

router.post('/', createAdminCollection);
router.patch('/:id', updateAdminCollection);
router.delete('/:id', deleteAdminCollection);

export default router;
