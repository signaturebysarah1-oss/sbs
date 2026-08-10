import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createAdminProduct,
  listAdminProducts,
  createAdminProductImage,
  createAdminProductVariant,
  deleteAdminProduct,
  deleteAdminProductImage,
  deleteAdminProductVariant,
  assignAdminProductCollection,
  removeAdminProductCollection,
  updateAdminProduct,
  updateAdminProductVariant,
} from '../controllers/product.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin', 'super_admin'));

router.get('/', listAdminProducts);
router.post('/', createAdminProduct);
router.patch('/:id', updateAdminProduct);
router.delete('/:id', deleteAdminProduct);
router.post('/:id/images', createAdminProductImage);
router.delete('/:id/images/:imageId', deleteAdminProductImage);
router.post('/:id/collections', assignAdminProductCollection);
router.delete('/:id/collections/:collectionId', removeAdminProductCollection);
router.post('/:id/variants', createAdminProductVariant);
router.patch('/:id/variants/:variantId', updateAdminProductVariant);
router.delete('/:id/variants/:variantId', deleteAdminProductVariant);

export default router;
