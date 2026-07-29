import { Router } from 'express';
import { listColors } from '../controllers/color.controller.js';

const router = Router();

router.get('/', listColors);

export default router;
