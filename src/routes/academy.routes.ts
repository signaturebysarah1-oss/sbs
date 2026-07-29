import { Router } from 'express';
import { createAcademyRegistration } from '../controllers/academy.controller.js';

const router = Router();

router.post('/register', createAcademyRegistration);

export default router;
