import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAdminCartOrder, listAdminCartOrders, updateAdminCartOrderFulfillment, updateAdminCartOrderPayment, updateAdminCartOrderStatus } from '../controllers/cart.controller.js';

const router = Router();
router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));
router.get('/history', listAdminCartOrders);
router.get('/history/:id', getAdminCartOrder);
router.patch('/history/:id/status', updateAdminCartOrderStatus);
router.patch('/history/:id/payment', updateAdminCartOrderPayment);
router.patch('/history/:id/fulfillment', updateAdminCartOrderFulfillment);

export default router;
