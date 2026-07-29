import {
  addCartItem,
  clearCart,
  deleteCartItem,
  findOrCreateCartByProfileId,
  updateCartItemQuantity,
} from '../repositories/cart.repository.js';
import { AppError } from '../utils/AppError.js';
import type { AddCartItemInput, Cart } from '../types/cart.types.js';

export async function getMyCart(profileId: string): Promise<Cart> {
  return findOrCreateCartByProfileId(profileId);
}

export async function addItemToCart(profileId: string, input: AddCartItemInput): Promise<Cart> {
  const cart = await addCartItem(profileId, input.productId, input.variantId ?? null, input.quantity);
  if (!cart) throw AppError.notFound('Product or variant not found');
  return cart;
}

export async function updateMyCartItem(
  profileId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  const updated = await updateCartItemQuantity(profileId, itemId, quantity);
  if (!updated) throw AppError.notFound('Cart item not found');
}

export async function removeMyCartItem(profileId: string, itemId: string): Promise<void> {
  const deleted = await deleteCartItem(profileId, itemId);
  if (!deleted) throw AppError.notFound('Cart item not found');
}

export async function clearMyCart(profileId: string): Promise<void> {
  await clearCart(profileId);
}
