import { Router } from 'express';
import { listCollections, getCollection } from '../controllers/collection.controller.js';

const router = Router();

router.get('/', listCollections);
router.get('/:slug', getCollection);

export default router;
