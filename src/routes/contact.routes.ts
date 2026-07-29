import { Router } from 'express';
import { createContactSubmission } from '../controllers/contact.controller.js';

const router = Router();

router.post('/', createContactSubmission);

export default router;
