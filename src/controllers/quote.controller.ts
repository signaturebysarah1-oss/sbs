import type { Response, NextFunction } from 'express';
import type { MaybeAuthenticatedRequest } from '../types/api.types.js';
import type { QuoteStatus } from '../types/quote.types.js';
import {
  submitQuote,
  getMyQuotes,
  getMyQuoteById,
  getAllQuotesAdmin,
  getQuoteByIdAdmin,
  changeQuoteStatus,
  updateMyQuote as updateCustomerQuote,
  submitMyQuoteReceipt,
  setQuotePayment,
  trackQuoteByReference,
  setQuoteFulfillment,
} from '../services/quote.service.js';
import { createQuoteSchema, updateCustomerQuoteSchema, updateQuoteStatusSchema, updateQuotePaymentSchema, submitQuoteReceiptSchema, updateQuoteFulfillmentSchema } from '../validators/quote.validator.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatus } from '../types/api.types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvedUser(req: MaybeAuthenticatedRequest) {
  if (!req.user) throw AppError.unauthorized('Not authenticated');
  return req.user;
}

// ─── Customer handlers ────────────────────────────────────────────────────────

export async function createQuote(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createQuoteSchema.safeParse(req.body);

    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }

    if (!req.user && (!parsed.data.guestName || !parsed.data.guestEmail)) {
      throw AppError.badRequest('guestName and guestEmail are required for guest quotes');
    }

    const quote = await submitQuote(req.user?.id ?? null, parsed.data, req.user);
    sendSuccess(res, 'Quote submitted successfully', quote, HttpStatus.CREATED);
  } catch (err) {
    next(err);
  }
}

export async function listMyQuotes(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = resolvedUser(req);
    const quotes = await getMyQuotes(user.id);
    sendSuccess(res, 'Quotes retrieved', quotes);
  } catch (err) {
    next(err);
  }
}

export async function getMyQuote(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = resolvedUser(req);
    const quote = await getMyQuoteById(req.params['id'] as string, user.id);
    sendSuccess(res, 'Quote retrieved', quote);
  } catch (err) {
    next(err);
  }
}

export async function updateMyQuote(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = resolvedUser(req);
    const parsed = updateCustomerQuoteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const quote = await updateCustomerQuote(req.params['id'] as string, user.id, parsed.data);
    sendSuccess(res, 'Quote updated', quote);
  } catch (err) {
    next(err);
  }
}

export async function submitQuoteReceipt(req: MaybeAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = submitQuoteReceiptSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    const quote = await submitMyQuoteReceipt(req.params['id'] as string, resolvedUser(req).id, parsed.data);
    sendSuccess(res, 'Quote receipt updated', quote);
  } catch (err) { next(err); }
}

export async function trackMyQuote(req: MaybeAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const quote = await trackQuoteByReference(req.params['orderNumber'] as string);
    const total = quote.items.reduce((sum, item) => sum + (item.unitPriceSnapshot ?? 0) * item.quantity, 0);
    sendSuccess(res, 'Quote tracking retrieved', {
      orderNumber: quote.referenceNumber, orderType: 'quote', status: quote.status,
      statusHistory: quote.statusHistory.map((entry) => ({ status: entry.newStatus, previousStatus: entry.oldStatus, note: entry.note, createdAt: entry.createdAt })),
      submittedAt: quote.submittedAt, reviewedAt: quote.reviewedAt, completedAt: quote.completedAt, createdAt: quote.createdAt,
      items: quote.items, total, paymentUrl: quote.paymentUrl, receiptUrl: quote.receiptUrl, receiptPublicId: quote.receiptPublicId,
      state: quote.state, city: quote.city, address: quote.address,
      shippingTrackingNumber: quote.shippingTrackingNumber, shippingTrackingUrl: quote.shippingTrackingUrl, shippingDetails: quote.shippingDetails,
    });
  } catch (err) { next(err); }
}

// ─── Admin handlers ───────────────────────────────────────────────────────────

export async function listAllQuotes(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = req.query['status'] as QuoteStatus | undefined;
    const quotes = await getAllQuotesAdmin(status);
    sendSuccess(res, 'Quotes retrieved', quotes);
  } catch (err) {
    next(err);
  }
}

export async function getAdminQuote(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const quote = await getQuoteByIdAdmin(req.params['id'] as string);
    sendSuccess(res, 'Quote retrieved', quote);
  } catch (err) {
    next(err);
  }
}

export async function updateQuoteStatus(
  req: MaybeAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = resolvedUser(req);
    const parsed = updateQuoteStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }

    const quote = await changeQuoteStatus(
      req.params['id'] as string,
      user.id,
      parsed.data,
    );
    sendSuccess(res, 'Quote status updated', quote);
  } catch (err) {
    next(err);
  }
}

export async function updateAdminQuotePayment(req: MaybeAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateQuotePaymentSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    const quote = await setQuotePayment(req.params['id'] as string, parsed.data);
    sendSuccess(res, 'Quote payment updated', quote);
  } catch (err) { next(err); }
}

export async function updateAdminQuoteFulfillment(req: MaybeAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateQuoteFulfillmentSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    sendSuccess(res, 'Quote fulfillment updated', await setQuoteFulfillment(req.params['id'] as string, parsed.data));
  } catch (err) { next(err); }
}
