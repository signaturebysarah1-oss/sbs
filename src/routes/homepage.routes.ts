import { Router } from 'express';
import { getCarousel } from '../controllers/homepage.controller.js';
const router = Router();
router.get('/carousel', getCarousel);
export default router;
