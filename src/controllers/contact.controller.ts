import type { Request, Response, NextFunction } from 'express';
import { createContactSubmissionSchema } from '../validators/contact.validator.js';
import {
  getAllContactSubmissions,
  getContactSubmissionById,
  submitContactForm,
} from '../services/contact.service.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatus } from '../types/api.types.js';
import { sendSuccess } from '../utils/response.js';

export async function createContactSubmission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createContactSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }

    const submission = await submitContactForm(parsed.data);
    sendSuccess(res, 'Contact submission received', submission, HttpStatus.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listAdminContactSubmissions(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submissions = await getAllContactSubmissions();
    sendSuccess(res, 'Contact submissions retrieved', submissions);
  } catch (err) {
    next(err);
  }
}

export async function getAdminContactSubmission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const submission = await getContactSubmissionById(req.params['id'] as string);
    sendSuccess(res, 'Contact submission retrieved', submission);
  } catch (err) {
    next(err);
  }
}
