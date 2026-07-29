import type { Response, NextFunction } from 'express';
import type { MaybeAuthenticatedRequest } from '../types/api.types.js';
import { addMyFavorite, getMyFavorites, removeMyFavorite } from '../services/favorite.service.js';
import { favoriteProductIdSchema } from '../validators/favorite.validator.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatus } from '../types/api.types.js';
import { sendSuccess } from '../utils/response.js';

function resolvedProfileId(req: MaybeAuthenticatedRequest): string {
  if (!req.user) throw AppError.unauthorized('Not authenticated');
  return req.user.id;
}

function validatedProductId(value: string): string {
  const parsed = favoriteProductIdSchema.safeParse(value);
  if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid product ID');
  return parsed.data;
}

export async function listFavorites(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const favorites = await getMyFavorites(resolvedProfileId(req));
    sendSuccess(res, 'Favorites retrieved', favorites);
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await addMyFavorite(resolvedProfileId(req), validatedProductId(req.params['productId'] as string));
    sendSuccess(res, 'Product added to favorites', {}, HttpStatus.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function deleteFavorite(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await removeMyFavorite(resolvedProfileId(req), validatedProductId(req.params['productId'] as string));
    sendSuccess(res, 'Product removed from favorites');
  } catch (err) {
    next(err);
  }
}
