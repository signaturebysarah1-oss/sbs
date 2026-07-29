import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listAllQuotes,
  getAdminQuote,
  updateQuoteStatus,
} from '../controllers/quote.controller.js';

const router = Router();

// All admin routes require authentication and an admin-level role.
router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));

router.get('/', listAllQuotes);
router.get('/:id', getAdminQuote);
router.patch('/:id/status', updateQuoteStatus);

export default router;
