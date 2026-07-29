import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addFavorite,
  deleteFavorite,
  listFavorites,
} from '../controllers/favorite.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listFavorites);
router.post('/:productId', addFavorite);
router.delete('/:productId', deleteFavorite);

export default router;
