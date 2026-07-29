import {
  addFavorite,
  deleteFavorite,
  findFavoritesByProfileId,
} from '../repositories/favorite.repository.js';
import { AppError } from '../utils/AppError.js';
import type { Favorite } from '../types/favorite.types.js';

export async function getMyFavorites(profileId: string): Promise<Favorite[]> {
  return findFavoritesByProfileId(profileId);
}

export async function addMyFavorite(profileId: string, productId: string): Promise<void> {
  const result = await addFavorite(profileId, productId);
  if (result === 'missing') throw AppError.notFound('Product not found');
  if (result === 'duplicate') throw AppError.conflict('Product is already in favorites');
}

export async function removeMyFavorite(profileId: string, productId: string): Promise<void> {
  const deleted = await deleteFavorite(profileId, productId);
  if (!deleted) throw AppError.notFound('Favorite not found');
}
