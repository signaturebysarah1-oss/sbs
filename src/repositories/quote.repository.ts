import { pool } from '../database/pool.js';
import type {
  QuoteRequest,
  QuoteRequestAdmin,
  QuoteRequestSummary,
  QuoteRequestAdminSummary,
  QuoteItem,
  QuoteStatus,
  QuoteItemInput,
} from '../types/quote.types.js';
import { findStatusHistoryByQuoteId } from './quote-status.repository.js';

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToQuoteItem(row: Record<string, unknown>): QuoteItem {
  return {
    id: row['id'] as string,
    productId: (row['product_id'] as string | null) ?? null,
    productNameSnapshot: row['product_name_snapshot'] as string,
    variantLabelSnapshot: (row['variant_label_snapshot'] as string | null) ?? null,
    materialNameSnapshot: (row['material_name_snapshot'] as string | null) ?? null,
    colorNameSnapshot: (row['color_name_snapshot'] as string | null) ?? null,
    quantity: row['quantity'] as number,
    unitPriceSnapshot: parseFloat(row['unit_price_snapshot'] as string),
    customMeasurements:
      (row['custom_measurements'] as Record<string, unknown> | null) ?? null,
    customNotes: (row['custom_notes'] as string | null) ?? null,
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}

function rowToSummary(row: Record<string, unknown>): QuoteRequestSummary {
  return {
    id: row['id'] as string,
    referenceNumber: row['reference_number'] as string,
    profileId: (row['profile_id'] as string | null) ?? null,
    status: row['status'] as QuoteStatus,
    customerNotes: (row['customer_notes'] as string | null) ?? null,
    submittedAt: (row['submitted_at'] as Date).toISOString(),
    reviewedAt: row['reviewed_at'] ? (row['reviewed_at'] as Date).toISOString() : null,
    completedAt: row['completed_at'] ? (row['completed_at'] as Date).toISOString() : null,
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

function rowToAdminSummary(row: Record<string, unknown>): QuoteRequestAdminSummary {
  return {
    ...rowToSummary(row),
    adminNotes: (row['admin_notes'] as string | null) ?? null,
    customerName: (row['customer_name'] as string | null) ?? null,
    customerEmail: (row['customer_email'] as string | null) ?? null,
    customerPhone: (row['customer_phone'] as string | null) ?? null,
  };
}

// ─── Reference number generation ─────────────────────────────────────────────

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createQuoteWithItems(data: {
  profileId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  customerNotes: string | null;
  items: QuoteItemInput[];
}): Promise<string> {
  // Wrapped in a transaction — quote_request + all quote_items must succeed together.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Serialize number allocation per year so concurrent submissions cannot
    // receive the same unique SBS-YYYY-NNNNN reference number.
    const year = new Date().getFullYear();
    await client.query('SELECT pg_advisory_xact_lock($1)', [year]);
    const countResult = await client.query(
      `SELECT COUNT(*) AS total
       FROM quote_requests
       WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year],
    );
    const count = parseInt(
      (countResult.rows[0] as Record<string, unknown>)['total'] as string,
      10,
    );
    const referenceNumber = `SBS-${year}-${String(count + 1).padStart(5, '0')}`;

    const quoteResult = await client.query(
      `INSERT INTO quote_requests
         (reference_number, profile_id, guest_name, guest_email, guest_phone, customer_notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [
        referenceNumber,
        data.profileId,
        data.guestName,
        data.guestEmail,
        data.guestPhone,
        data.customerNotes,
      ],
    );

    const quoteId = (quoteResult.rows[0] as Record<string, unknown>)['id'] as string;

    for (const item of data.items) {
      await client.query(
        `INSERT INTO quote_items
           (quote_request_id, product_id, product_name_snapshot, variant_label_snapshot,
            material_name_snapshot, color_name_snapshot, quantity,
            unit_price_snapshot, custom_measurements, custom_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          quoteId,
          item.productId,
          item.productNameSnapshot,
          item.variantLabelSnapshot ?? null,
          item.materialNameSnapshot ?? null,
          item.colorNameSnapshot ?? null,
          item.quantity,
          item.unitPriceSnapshot,
          item.customMeasurements ? JSON.stringify(item.customMeasurements) : null,
          item.customNotes ?? null,
        ],
      );
    }

    await client.query(
      `INSERT INTO quote_status_history
         (quote_request_id, old_status, new_status, changed_by, note)
       VALUES ($1, NULL, 'pending', $2, NULL)`,
      [quoteId, data.profileId],
    );

    await client.query('COMMIT');
    return quoteId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Customer queries ─────────────────────────────────────────────────────────

export async function findQuotesByProfileId(
  profileId: string,
): Promise<QuoteRequestSummary[]> {
  const result = await pool.query(
    `SELECT id, reference_number, profile_id, status, customer_notes,
            submitted_at, reviewed_at, completed_at, created_at, updated_at
     FROM quote_requests
     WHERE profile_id = $1
     ORDER BY created_at DESC`,
    [profileId],
  );
  return (result.rows as Record<string, unknown>[]).map(rowToSummary);
}

export async function findQuoteByIdAndProfileId(
  id: string,
  profileId: string,
): Promise<QuoteRequest | null> {
  const result = await pool.query(
    `SELECT id, reference_number, profile_id, status, customer_notes,
            submitted_at, reviewed_at, completed_at, created_at, updated_at
     FROM quote_requests
     WHERE id = $1 AND profile_id = $2`,
    [id, profileId],
  );
  if (result.rows.length === 0) return null;

  const summary = rowToSummary(result.rows[0] as Record<string, unknown>);
  const [items, statusHistory] = await Promise.all([
    findQuoteItemsByQuoteId(id),
    findStatusHistoryByQuoteId(id),
  ]);

  return { ...summary, items, statusHistory };
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function findAllQuotesAdmin(
  status?: QuoteStatus,
): Promise<QuoteRequestAdminSummary[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (status) {
    conditions.push(`qr.status = $${values.length + 1}`);
    values.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT
       qr.id, qr.reference_number, qr.profile_id, qr.status,
       qr.customer_notes, qr.admin_notes,
       qr.submitted_at, qr.reviewed_at, qr.completed_at,
       qr.created_at, qr.updated_at,
       COALESCE(p.full_name, qr.guest_name)   AS customer_name,
       COALESCE(u.email,     qr.guest_email)  AS customer_email,
       COALESCE(p.phone,     qr.guest_phone)  AS customer_phone
     FROM quote_requests qr
     LEFT JOIN profiles p    ON p.id = qr.profile_id
     LEFT JOIN auth.users u  ON u.id = p.auth_user_id
     ${where}
     ORDER BY qr.created_at DESC`,
    values,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToAdminSummary);
}

export async function findQuoteByIdAdmin(id: string): Promise<QuoteRequestAdmin | null> {
  const result = await pool.query(
    `SELECT
       qr.id, qr.reference_number, qr.profile_id, qr.status,
       qr.customer_notes, qr.admin_notes,
       qr.submitted_at, qr.reviewed_at, qr.completed_at,
       qr.created_at, qr.updated_at,
       COALESCE(p.full_name, qr.guest_name)   AS customer_name,
       COALESCE(u.email,     qr.guest_email)  AS customer_email,
       COALESCE(p.phone,     qr.guest_phone)  AS customer_phone
     FROM quote_requests qr
     LEFT JOIN profiles p    ON p.id = qr.profile_id
     LEFT JOIN auth.users u  ON u.id = p.auth_user_id
     WHERE qr.id = $1`,
    [id],
  );
  if (result.rows.length === 0) return null;

  const summary = rowToAdminSummary(result.rows[0] as Record<string, unknown>);
  const [items, statusHistory] = await Promise.all([
    findQuoteItemsByQuoteId(id),
    findStatusHistoryByQuoteId(id),
  ]);

  return { ...summary, items, statusHistory };
}

// ─── Status update ────────────────────────────────────────────────────────────

export async function updateQuoteStatus(data: {
  quoteId: string;
  oldStatus: QuoteStatus;
  newStatus: QuoteStatus;
  changedByProfileId: string;
  note: string | null;
}): Promise<QuoteStatus | null> {
  const result = await pool.query(
    `WITH updated_quote AS (
       UPDATE quote_requests
       SET
         status       = $1,
         reviewed_at  = CASE WHEN $1 = 'reviewing' AND reviewed_at IS NULL THEN now() ELSE reviewed_at END,
         completed_at = CASE WHEN $1 = 'completed' AND completed_at IS NULL THEN now() ELSE completed_at END
       WHERE id = $2 AND status = $3
       RETURNING id, status
     ), inserted_history AS (
       INSERT INTO quote_status_history
         (quote_request_id, old_status, new_status, changed_by, note)
       SELECT id, $3, $1, $4, $5
       FROM updated_quote
     )
     SELECT status FROM updated_quote`,
    [
      data.newStatus,
      data.quoteId,
      data.oldStatus,
      data.changedByProfileId,
      data.note,
    ],
  );
  if (result.rows.length === 0) return null;
  return (result.rows[0] as Record<string, unknown>)['status'] as QuoteStatus;
}

export async function findQuoteCurrentStatus(id: string): Promise<QuoteStatus | null> {
  const result = await pool.query(
    `SELECT status FROM quote_requests WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) return null;
  return (result.rows[0] as Record<string, unknown>)['status'] as QuoteStatus;
}

// ─── Items ────────────────────────────────────────────────────────────────────

async function findQuoteItemsByQuoteId(quoteRequestId: string): Promise<QuoteItem[]> {
  const result = await pool.query(
    `SELECT id, product_id, product_name_snapshot, variant_label_snapshot,
            material_name_snapshot, color_name_snapshot, quantity,
            unit_price_snapshot, custom_measurements, custom_notes, created_at
     FROM quote_items
     WHERE quote_request_id = $1
     ORDER BY created_at ASC`,
    [quoteRequestId],
  );
  return (result.rows as Record<string, unknown>[]).map(rowToQuoteItem);
}
