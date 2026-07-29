import type { Request, Response, NextFunction } from 'express';
import { createAcademyRegistrationSchema } from '../validators/academy.validator.js';
import {
  getAcademyRegistrationById,
  getAllAcademyRegistrations,
  registerForAcademy,
} from '../services/academy.service.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatus } from '../types/api.types.js';
import { sendSuccess } from '../utils/response.js';

export async function createAcademyRegistration(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createAcademyRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }

    const registration = await registerForAcademy(parsed.data);
    sendSuccess(res, 'Academy registration received', registration, HttpStatus.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listAdminAcademyApplications(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const applications = await getAllAcademyRegistrations();
    sendSuccess(res, 'Academy applications retrieved', applications);
  } catch (err) {
    next(err);
  }
}

export async function getAdminAcademyApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const application = await getAcademyRegistrationById(req.params['id'] as string);
    sendSuccess(res, 'Academy application retrieved', application);
  } catch (err) {
    next(err);
  }
}
