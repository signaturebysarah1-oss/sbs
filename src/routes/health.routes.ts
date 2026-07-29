import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, 'API is running');
});

export default router;
