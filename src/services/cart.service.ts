import {
  addItemToActiveCart,
  clearActiveCart,
  deleteCartItem,
  findCartHistoryByProfileId,
  findOrCreateActiveCart,
  submitActiveCart,
  updateCartItem,
} from '../repositories/cart.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  AddCartItemInput,
  Cart,
  CartHistory,
  CartSubmitResult,
  UpdateCartItemInput,
} from '../types/cart.types.js';

export async function getMyCart(profileId: string): Promise<Cart> {
  return findOrCreateActiveCart(profileId);
}

export async function addItemToCart(profileId: string, input: AddCartItemInput): Promise<Cart> {
  return addItemToActiveCart(profileId, input);
}

export async function updateMyCartItem(
  profileId: string,
  itemId: string,
  input: UpdateCartItemInput,
): Promise<void> {
  const updated = await updateCartItem(profileId, itemId, input);
  if (!updated) throw AppError.notFound('Cart item not found');
}

export async function removeMyCartItem(profileId: string, itemId: string): Promise<void> {
  const deleted = await deleteCartItem(profileId, itemId);
  if (!deleted) throw AppError.notFound('Cart item not found');
}

export async function clearMyCart(profileId: string): Promise<void> {
  await clearActiveCart(profileId);
}

export async function getMyCartHistory(profileId: string): Promise<CartHistory[]> {
  return findCartHistoryByProfileId(profileId);
}

export async function submitMyCart(profileId: string): Promise<CartSubmitResult> {
  try {
    return await submitActiveCart(profileId);
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_ACTIVE_CART') {
      throw AppError.notFound('No active cart found');
    }
    throw err;
  }
}
