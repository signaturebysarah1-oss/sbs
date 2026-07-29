import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  getCart,
  updateCartItem,
} from '../controllers/cart.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', getCart);
router.post('/items', addCartItem);
router.patch('/items/:id', updateCartItem);
router.delete('/items/:id', deleteCartItem);
router.delete('/', clearCart);

export default router;
