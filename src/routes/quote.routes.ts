import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import {
  createQuote,
  listMyQuotes,
  getMyQuote,
  updateMyQuote,
  submitQuoteReceipt,
} from '../controllers/quote.controller.js';

const router = Router();

// Quote submission supports both guests and logged-in customers. History remains private.
router.post('/', optionalAuth, createQuote);
router.use(requireAuth);
router.get('/my', listMyQuotes);
router.get('/:id', getMyQuote);
router.patch('/:id', updateMyQuote);
router.patch('/:id/receipt', submitQuoteReceipt);

export default router;
