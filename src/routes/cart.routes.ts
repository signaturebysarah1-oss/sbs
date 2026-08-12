import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  getCart,
  getCartHistory,
  getCartHistoryItem,
  submitCart,
  updateCartItem,
  submitCartReceipt,
  updateCartDetails,
} from '../controllers/cart.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', getCart);
router.patch('/', updateCartDetails);
router.get('/history', getCartHistory);
router.get('/history/:id', getCartHistoryItem);
router.patch('/history/:id/receipt', submitCartReceipt);
router.post('/items', addCartItem);
router.post('/submit', submitCart);
router.patch('/items/:id', updateCartItem);
router.delete('/items/:id', deleteCartItem);
router.delete('/', clearCart);

export default router;
