import type { Request, Response, NextFunction } from 'express';
import {
  getAllCollections,
  getCollectionBySlug,
  getManagedCollections,
  createManagedCollection,
  removeManagedCollection,
  updateManagedCollection,
} from '../services/collection.service.js';
import { sendSuccess } from '../utils/response.js';
import { createCollectionSchema, updateCollectionSchema } from '../validators/admin-catalog.validator.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatus } from '../types/api.types.js';

export async function listCollections(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const featuredQuery = req.query['featured'];
    let featured: boolean | undefined;
    if (featuredQuery === 'true') {
      featured = true;
    } else if (featuredQuery === 'false') {
      featured = false;
    } else if (featuredQuery !== undefined) {
      throw AppError.badRequest('featured must be true or false');
    }
    const collections = await getAllCollections(featured);
    sendSuccess(res, 'Collections retrieved', collections);
  } catch (err) {
    next(err);
  }
}

export async function getCollection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const collection = await getCollectionBySlug(req.params['slug'] as string);
    sendSuccess(res, 'Collection retrieved', collection);
  } catch (err) {
    next(err);
  }
}

export async function createAdminCollection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createCollectionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const collection = await createManagedCollection(parsed.data);
    sendSuccess(res, 'Collection created', collection, HttpStatus.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listAdminCollections(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, 'Collections retrieved', await getManagedCollections());
  } catch (err) {
    next(err);
  }
}

export async function updateAdminCollection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateCollectionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const collection = await updateManagedCollection(req.params['id'] as string, parsed.data);
    sendSuccess(res, 'Collection updated', collection);
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminCollection(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await removeManagedCollection(req.params['id'] as string);
    sendSuccess(res, 'Collection deleted');
  } catch (err) {
    next(err);
  }
}
