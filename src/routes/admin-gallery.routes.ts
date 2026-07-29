import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createAdminGalleryImage,
  deleteAdminGalleryImage,
} from '../controllers/gallery.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));
router.post('/', createAdminGalleryImage);
router.delete('/:id', deleteAdminGalleryImage);

export default router;
