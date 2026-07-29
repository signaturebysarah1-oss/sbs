import { Router } from 'express';
import {
  listProducts,
  getFeatured,
  getHero,
  getProduct,
} from '../controllers/product.controller.js';

const router = Router();

// Static routes must come before /:slug
router.get('/featured', getFeatured);
router.get('/hero', getHero);

router.get('/', listProducts);
router.get('/:slug', getProduct);

export default router;
