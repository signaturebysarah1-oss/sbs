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
import { pool } from '../database/pool.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/mailer.js';
import { buildQuoteSubmissionEmail } from '../utils/quoteSubmissionEmail.js';
import { env } from '../config/env.js';
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
import type { AuthUser } from '../types/api.types.js';

// ─── Email notification (fire-and-forget) ────────────────────────────────────

async function sendQuoteNotificationEmail(quote: QuoteRequestAdmin, isGuest: boolean): Promise<void> {
  const contactMethod = quote.contactMethod ?? 'email';
  const html = buildQuoteSubmissionEmail({
    customerName: quote.customerName ?? 'Unknown',
    customerEmail: quote.customerEmail ?? '',
    customerPhone: quote.customerPhone ?? null,
    contactMethod,
    referenceNumber: quote.referenceNumber,
    status: quote.status,
    submittedAt: quote.submittedAt,
    customerNotes: quote.customerNotes,
    items: quote.items,
    isGuest,
  });

  await sendEmail({
    to: env.notificationEmail,
    subject: `New Quote Submission — ${quote.referenceNumber}`,
    html,
  });
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function submitQuote(
  profileId: string | null,
  input: CreateQuoteInput,
  user?: AuthUser,
): Promise<QuoteRequest> {
  // ── Guest path ──────────────────────────────────────────────────────────────
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
      contactMethod: null,   // guests use guestPhone directly; no contactMethod stored
      phoneNumber: null,
    });

    const quote = await findQuoteByIdAdmin(quoteId);
    if (!quote) throw new AppError('Quote created but could not be retrieved', 500);

    // Send notification — guest phone is already on the quote record
    sendQuoteNotificationEmail(
      { ...quote, contactMethod: 'whatsapp' },  // guests always provide phone
      true,
    ).catch((err: unknown) => console.error('[quote] Failed to send guest notification email:', err));

    return quote;
  }

  // ── Authenticated path ──────────────────────────────────────────────────────
  const contactMethod = input.contactMethod ?? 'email';
  const phoneNumber = input.phoneNumber ?? null;

  // WhatsApp requires a phone number — either submitted now or already on profile
  if (contactMethod === 'whatsapp' && !phoneNumber) {
    // Check if the profile already has a phone saved
    const profileResult = await pool.query(
      `SELECT phone FROM profiles WHERE id = $1`,
      [profileId],
    );
    const savedPhone = ((profileResult.rows[0] as Record<string, unknown>)?.['phone'] as string | null) ?? null;

    if (!savedPhone) {
      throw AppError.badRequest(
        'A phone number is required when WhatsApp is selected as the contact method',
      );
    }

    // Has a saved phone — proceed using it (no update needed)
    const existingDraftId = await findPendingDraftByProfileId(profileId);
    const quoteId = existingDraftId
      ? await mergeIntoDraft(existingDraftId, profileId, input)
      : await createQuoteWithItems({
          profileId,
          guestName: null,
          guestEmail: null,
          guestPhone: null,
          customerNotes: input.customerNotes ?? null,
          items: input.items ?? [],
          contactMethod,
          phoneNumber: null,
        });

    return finishAuthenticatedQuote(quoteId, profileId);
  }

  // email method or whatsapp with a new phone number provided
  const existingDraftId = await findPendingDraftByProfileId(profileId);

  const quoteId = existingDraftId
    ? await mergeIntoDraft(existingDraftId, profileId, input)
    : await createQuoteWithItems({
        profileId,
        guestName: null,
        guestEmail: null,
        guestPhone: null,
        customerNotes: input.customerNotes ?? null,
        items: input.items ?? [],
        contactMethod,
        phoneNumber: contactMethod === 'whatsapp' ? phoneNumber : null,
      });

  return finishAuthenticatedQuote(quoteId, profileId);
}

async function mergeIntoDraft(
  draftId: string,
  profileId: string,
  input: CreateQuoteInput,
): Promise<string> {
  await updateCustomerQuoteWithItems({
    quoteId: draftId,
    profileId,
    customerNotes: input.customerNotes,
    items: input.items,
  });
  return draftId;
}

async function finishAuthenticatedQuote(
  quoteId: string,
  profileId: string,
): Promise<QuoteRequest> {
  const quote = await findQuoteByIdAndProfileId(quoteId, profileId);
  if (!quote) throw new AppError('Quote created but could not be retrieved', 500);

  const adminQuote = await findQuoteByIdAdmin(quoteId);
  if (adminQuote) {
    sendQuoteNotificationEmail(adminQuote, false).catch((err: unknown) =>
      console.error('[quote] Failed to send authenticated notification email:', err),
    );
  }

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
