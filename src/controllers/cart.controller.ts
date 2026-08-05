import type { Response, NextFunction } from 'express';
import type { MaybeAuthenticatedRequest } from '../types/api.types.js';
import {
  addItemToCart,
  clearMyCart,
  getMyCart,
  getMyCartHistory,
  removeMyCartItem,
  submitMyCart,
  updateMyCartItem,
} from '../services/cart.service.js';
import { addCartItemSchema, updateCartItemSchema, submitCartSchema } from '../validators/cart.validator.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatus } from '../types/api.types.js';
import { sendSuccess } from '../utils/response.js';

function resolvedProfileId(req: MaybeAuthenticatedRequest): string {
  if (!req.user) throw AppError.unauthorized('Not authenticated');
  return req.user.id;
}

export async function getCart(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cart = await getMyCart(resolvedProfileId(req));
    sendSuccess(res, 'Cart retrieved', cart);
  } catch (err) {
    next(err);
  }
}

export async function addCartItem(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = addCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const cart = await addItemToCart(resolvedProfileId(req), parsed.data);
    sendSuccess(res, 'Item added to cart', cart, HttpStatus.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    await updateMyCartItem(resolvedProfileId(req), req.params['id'] as string, parsed.data);
    sendSuccess(res, 'Cart item updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteCartItem(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await removeMyCartItem(resolvedProfileId(req), req.params['id'] as string);
    sendSuccess(res, 'Cart item removed');
  } catch (err) {
    next(err);
  }
}

export async function clearCart(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await clearMyCart(resolvedProfileId(req));
    sendSuccess(res, 'Cart cleared');
  } catch (err) {
    next(err);
  }
}

export async function getCartHistory(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const history = await getMyCartHistory(resolvedProfileId(req));
    sendSuccess(res, 'Cart history retrieved', history);
  } catch (err) {
    next(err);
  }
}

export async function submitCart(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const parsed = submitCartSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const result = await submitMyCart(req.user, parsed.data);
    sendSuccess(res, 'Cart submitted successfully', result);
  } catch (err) {
    next(err);
  }
}
