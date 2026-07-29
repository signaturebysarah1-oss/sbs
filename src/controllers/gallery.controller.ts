import type { Request, Response, NextFunction } from 'express';
import {
  createManagedGalleryImage,
  getPublishedGalleryImages,
  removeManagedGalleryImage,
} from '../services/gallery.service.js';
import { createGalleryImageSchema } from '../validators/gallery.validator.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatus } from '../types/api.types.js';
import { sendSuccess } from '../utils/response.js';

export async function listGalleryImages(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const images = await getPublishedGalleryImages();
    sendSuccess(res, 'Gallery images retrieved', images);
  } catch (err) {
    next(err);
  }
}

export async function createAdminGalleryImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createGalleryImageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const image = await createManagedGalleryImage(parsed.data);
    sendSuccess(res, 'Gallery image created', image, HttpStatus.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminGalleryImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await removeManagedGalleryImage(req.params['id'] as string);
    sendSuccess(res, 'Gallery image deleted');
  } catch (err) {
    next(err);
  }
}
