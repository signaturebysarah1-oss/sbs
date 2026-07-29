import { Router } from 'express';
import { listGalleryImages } from '../controllers/gallery.controller.js';

const router = Router();
router.get('/', listGalleryImages);

export default router;
