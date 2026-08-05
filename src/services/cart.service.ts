import {
  addItemToActiveCart,
  clearActiveCart,
  deleteCartItem,
  findCartHistoryByProfileId,
  findOrCreateActiveCart,
  submitActiveCart,
  updateCartItem,
} from '../repositories/cart.repository.js';
import { findProfileByAuthUserId } from '../repositories/profile.repository.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/mailer.js';
import { buildCartSubmissionEmail } from '../utils/cartSubmissionEmail.js';
import { env } from '../config/env.js';
import type {
  AddCartItemInput,
  Cart,
  CartHistory,
  CartSubmitInput,
  CartSubmitResult,
  UpdateCartItemInput,
} from '../types/cart.types.js';
import type { AuthUser } from '../types/api.types.js';

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

export async function submitMyCart(
  user: AuthUser,
  input: CartSubmitInput,
): Promise<CartSubmitResult> {
  const phoneNumber = input.phoneNumber ?? null;

  let result: Awaited<ReturnType<typeof submitActiveCart>>;
  try {
    result = await submitActiveCart(user.id, input.contactMethod, phoneNumber);
  } catch (err) {
    if (err instanceof Error && err.message === 'NO_ACTIVE_CART') {
      throw AppError.notFound('No active cart found');
    }
    throw err;
  }

  // Fetch the history record to get items for the email
  // Fire-and-forget: email failure must not affect the API response
  sendCartNotificationEmail(user, input, result).catch((err: unknown) => {
    console.error('[cart] Failed to send submission email:', err);
  });

  return {
    submittedCartId: result.submittedCartId,
    historyId: result.historyId,
    newActiveCartId: result.newActiveCartId,
  };
}

async function sendCartNotificationEmail(
  user: AuthUser,
  input: CartSubmitInput,
  result: { historyId: string; resolvedPhone: string | null },
): Promise<void> {
  // Fetch the history record to get the items snapshot
  const historyRows = await findCartHistoryByProfileId(user.id);
  const historyRecord = historyRows.find((h) => h.id === result.historyId);
  if (!historyRecord) return;

  const html = buildCartSubmissionEmail({
    customerName: user.fullName,
    customerEmail: user.email,
    contactMethod: input.contactMethod,
    phoneNumber: result.resolvedPhone,
    items: historyRecord.items,
    totalSnapshot: historyRecord.totalSnapshot,
    submittedCartId: result.historyId,
  });

  await sendEmail({
    to: env.notificationEmail,
    subject: `New Cart Submission — ${user.fullName}`,
    html,
  });
}
