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
} from '../services/quote.service.js';
import { createQuoteSchema, updateQuoteStatusSchema } from '../validators/quote.validator.js';
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

    const quote = await submitQuote(req.user?.id ?? null, parsed.data);
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
