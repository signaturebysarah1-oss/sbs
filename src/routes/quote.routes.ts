import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  createQuote,
  listMyQuotes,
  getMyQuote,
} from '../controllers/quote.controller.js';

const router = Router();

// Quote submission supports both guests and logged-in customers. History remains private.
router.post('/', optionalAuth, createQuote);
router.use(requireAuth);
router.get('/my', listMyQuotes);
router.get('/:id', getMyQuote);

export default router;
