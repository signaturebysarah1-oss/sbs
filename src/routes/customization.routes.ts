import { Router } from 'express';
import { listCustomizations } from '../controllers/customization.controller.js';
const router = Router();
router.get('/', listCustomizations);
export default router;
