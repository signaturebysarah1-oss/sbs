import { pool } from '../database/pool.js';
import type { QuoteStatusHistoryEntry, QuoteStatus } from '../types/quote.types.js';

function rowToHistoryEntry(row: Record<string, unknown>): QuoteStatusHistoryEntry {
  return {
    id: row['id'] as string,
    oldStatus: (row['old_status'] as QuoteStatus | null) ?? null,
    newStatus: row['new_status'] as QuoteStatus,
    changedBy: (row['changed_by'] as string | null) ?? null,
    changedByName: (row['changed_by_name'] as string | null) ?? null,
    note: (row['note'] as string | null) ?? null,
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}

export async function insertStatusHistory(data: {
  quoteRequestId: string;
  oldStatus: QuoteStatus | null;
  newStatus: QuoteStatus;
  changedBy: string | null;
  note?: string | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO quote_status_history
       (quote_request_id, old_status, new_status, changed_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.quoteRequestId, data.oldStatus, data.newStatus, data.changedBy, data.note ?? null],
  );
}

export async function findStatusHistoryByQuoteId(
  quoteRequestId: string,
): Promise<QuoteStatusHistoryEntry[]> {
  const result = await pool.query(
    `SELECT
       h.id, h.old_status, h.new_status, h.changed_by, h.note, h.created_at,
       p.full_name AS changed_by_name
     FROM quote_status_history h
     LEFT JOIN profiles p ON p.id = h.changed_by
     WHERE h.quote_request_id = $1
     ORDER BY h.created_at ASC`,
    [quoteRequestId],
  );
  return (result.rows as Record<string, unknown>[]).map(rowToHistoryEntry);
}
