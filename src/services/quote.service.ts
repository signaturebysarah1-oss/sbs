import {
  createQuoteWithItems,
  findQuotesByProfileId,
  findQuoteByIdAndProfileId,
  findAllQuotesAdmin,
  findQuoteByIdAdmin,
  findQuoteCurrentStatus,
  updateQuoteStatus,
} from '../repositories/quote.repository.js';
import { AppError } from '../utils/AppError.js';
import type {
  CreateQuoteInput,
  UpdateQuoteStatusInput,
  QuoteRequest,
  QuoteRequestAdmin,
  QuoteRequestSummary,
  QuoteRequestAdminSummary,
  QuoteStatus,
} from '../types/quote.types.js';

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function submitQuote(
  profileId: string | null,
  input: CreateQuoteInput,
): Promise<QuoteRequest> {
  let quoteId: string;
  try {
    quoteId = await createQuoteWithItems({
      profileId,
      guestName: profileId ? null : input.guestName ?? null,
      guestEmail: profileId ? null : input.guestEmail ?? null,
      guestPhone: profileId ? null : input.guestPhone ?? null,
      customerNotes: input.customerNotes ?? null,
      items: input.items,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Selected size ')) {
      throw AppError.badRequest('Selected size is not available for the product');
    }
    throw error;
  }

  const quote = profileId
    ? await findQuoteByIdAndProfileId(quoteId, profileId)
    : await findQuoteByIdAdmin(quoteId);
  if (!quote) throw new AppError('Quote created but could not be retrieved', 500);
  return quote;
}

export async function getMyQuotes(profileId: string): Promise<QuoteRequestSummary[]> {
  return findQuotesByProfileId(profileId);
}

export async function getMyQuoteById(
  id: string,
  profileId: string,
): Promise<QuoteRequest> {
  const quote = await findQuoteByIdAndProfileId(id, profileId);
  if (!quote) throw AppError.notFound('Quote not found');
  return quote;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAllQuotesAdmin(
  status?: QuoteStatus,
): Promise<QuoteRequestAdminSummary[]> {
  return findAllQuotesAdmin(status);
}

export async function getQuoteByIdAdmin(id: string): Promise<QuoteRequestAdmin> {
  const quote = await findQuoteByIdAdmin(id);
  if (!quote) throw AppError.notFound('Quote not found');
  return quote;
}

export async function changeQuoteStatus(
  quoteId: string,
  changedByProfileId: string,
  input: UpdateQuoteStatusInput,
): Promise<QuoteRequestAdmin> {
  const currentStatus = await findQuoteCurrentStatus(quoteId);
  if (currentStatus === null) throw AppError.notFound('Quote not found');

  if (currentStatus === input.status) {
    throw AppError.badRequest(`Quote is already in status: ${input.status}`);
  }

  const validTransitions: Record<QuoteStatus, readonly QuoteStatus[]> = {
    pending: ['reviewing', 'cancelled'],
    reviewing: ['approved', 'cancelled'],
    approved: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!validTransitions[currentStatus].includes(input.status)) {
    throw AppError.badRequest(`Cannot change quote status from ${currentStatus} to ${input.status}`);
  }

  const updatedStatus = await updateQuoteStatus({
    quoteId,
    oldStatus: currentStatus,
    newStatus: input.status,
    changedByProfileId,
    note: input.note ?? null,
  });
  if (!updatedStatus) {
    throw AppError.conflict('Quote status was changed by another request; please retry');
  }

  const updated = await findQuoteByIdAdmin(quoteId);
  if (!updated) throw AppError.notFound('Quote not found after update');
  return updated;
}
