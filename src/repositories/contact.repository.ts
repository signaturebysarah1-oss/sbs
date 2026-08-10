import { pool } from '../database/pool.js';
import type {
  AdminContactSubmission,
  ContactSubmission,
  ContactSubmissionInput,
} from '../types/form.types.js';

function rowToContactSubmission(row: Record<string, unknown>): ContactSubmission {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    email: row['email'] as string,
    phone: (row['phone'] as string | null) ?? null,
    subject: (row['subject'] as string | null) ?? null,
    message: row['message'] as string,
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}

function rowToAdminContactSubmission(row: Record<string, unknown>): AdminContactSubmission {
  return {
    ...rowToContactSubmission(row),
    isRead: row['is_read'] as boolean,
    adminNotes: (row['admin_notes'] as string | null) ?? null,
  };
}

export async function createContactSubmission(
  input: ContactSubmissionInput,
): Promise<ContactSubmission> {
  const result = await pool.query(
    `INSERT INTO contact_submissions (name, email, phone, subject, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, subject, message, created_at`,
    [input.name, input.email, input.phone ?? null, input.subject ?? null, input.message],
  );
  return rowToContactSubmission(result.rows[0] as Record<string, unknown>);
}

export async function findAllContactSubmissions(): Promise<AdminContactSubmission[]> {
  const result = await pool.query(
    `SELECT id, name, email, phone, subject, message, is_read, admin_notes, created_at
     FROM contact_submissions
     ORDER BY created_at DESC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToAdminContactSubmission);
}

export async function patchContactSubmissionIsRead(id: string, isRead: boolean): Promise<boolean> {
  const result = await pool.query(
    `UPDATE contact_submissions SET is_read = $1 WHERE id = $2 RETURNING id`,
    [isRead, id],
  );
  return result.rows.length > 0;
}

export async function findContactSubmissionById(
  id: string,
): Promise<AdminContactSubmission | null> {
  const result = await pool.query(
    `SELECT id, name, email, phone, subject, message, is_read, admin_notes, created_at
     FROM contact_submissions
     WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) return null;
  return rowToAdminContactSubmission(result.rows[0] as Record<string, unknown>);
}
