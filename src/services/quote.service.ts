import {
  createQuoteWithItems,
  findQuotesByProfileId,
  findQuoteByIdAndProfileId,
  findAllQuotesAdmin,
  findQuoteByIdAdmin,
  findQuoteCurrentStatus,
  updateQuoteStatus,
  updateCustomerQuoteWithItems,
  findPendingDraftByProfileId,
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
  UpdateCustomerQuoteInput,
} from '../types/quote.types.js';

// ─── Customer ─────────────────────────────────────────────────────────────────

// One-active-draft rule:
// Authenticated customers have at most one pending draft at a time.
// POST /api/quotes merges into the existing draft when one exists,
// and only creates a new record when none does.
// Guests always create a new quote (no profile to look up a draft against).
export async function submitQuote(
  profileId: string | null,
  input: CreateQuoteInput,
): Promise<QuoteRequest> {
  if (!profileId) {
    if (!input.guestName || !input.guestEmail) {
      throw AppError.badRequest('guestName and guestEmail are required for guest quotes');
    }
    const quoteId = await createQuoteWithItems({
      profileId: null,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone ?? null,
      customerNotes: input.customerNotes ?? null,
      items: input.items ?? [],
    });
    const quote = await findQuoteByIdAdmin(quoteId);
    if (!quote) throw new AppError('Quote created but could not be retrieved', 500);
    return quote;
  }

  // Check for an existing pending draft.
  const existingDraftId = await findPendingDraftByProfileId(profileId);

  if (existingDraftId) {
    // Merge into the existing draft — do not create a new record.
    await updateCustomerQuoteWithItems({
      quoteId: existingDraftId,
      profileId,
      customerNotes: input.customerNotes,
      items: input.items,
    });
    const quote = await findQuoteByIdAndProfileId(existingDraftId, profileId);
    if (!quote) throw new AppError('Draft quote could not be retrieved', 500);
    return quote;
  }

  // No pending draft — create a new one.
  const quoteId = await createQuoteWithItems({
    profileId,
    guestName: null,
    guestEmail: null,
    guestPhone: null,
    customerNotes: input.customerNotes ?? null,
    items: input.items ?? [],
  });

  const quote = await findQuoteByIdAndProfileId(quoteId, profileId);
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

export async function updateMyQuote(
  id: string,
  profileId: string,
  input: UpdateCustomerQuoteInput,
): Promise<QuoteRequest> {
  try {
    const updated = await updateCustomerQuoteWithItems({ quoteId: id, profileId, ...input });
    if (!updated) throw AppError.notFound('Quote not found');
  } catch (error) {
    if (error instanceof Error && error.message === 'Customer quote is already completed') {
      throw AppError.badRequest('Completed customer quotes cannot be updated');
    }
    throw error;
  }
  const quote = await findQuoteByIdAndProfileId(id, profileId);
  if (!quote) throw AppError.notFound('Quote not found after update');
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
