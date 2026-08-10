import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { trackMyCartOrder } from '../controllers/cart.controller.js';
import { trackMyQuote } from '../controllers/quote.controller.js';

const router = Router();
router.get('/cart/:orderNumber', requireAuth, trackMyCartOrder);
router.get('/quote/:orderNumber', trackMyQuote);

export default router;
