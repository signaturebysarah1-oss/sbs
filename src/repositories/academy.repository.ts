import { pool } from '../database/pool.js';
import type {
  AcademyRegistration,
  AcademyRegistrationInput,
  AdminAcademyRegistration,
} from '../types/form.types.js';

function rowToAcademyRegistration(row: Record<string, unknown>): AcademyRegistration {
  return {
    id: row['id'] as string,
    fullName: row['full_name'] as string,
    email: row['email'] as string,
    phone: row['phone'] as string,
    country: (row['country'] as string | null) ?? null,
    experienceLevel: (row['experience_level'] as AcademyRegistration['experienceLevel']) ?? null,
    motivation: (row['motivation'] as string | null) ?? null,
    status: row['status'] as 'pending',
    createdAt: (row['created_at'] as Date).toISOString(),
  };
}

function rowToAdminAcademyRegistration(row: Record<string, unknown>): AdminAcademyRegistration {
  return {
    ...rowToAcademyRegistration(row),
    status: row['status'] as AdminAcademyRegistration['status'],
    adminNotes: (row['admin_notes'] as string | null) ?? null,
    isRead: row['is_read'] as boolean,
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

export async function createAcademyRegistration(
  input: AcademyRegistrationInput,
): Promise<AcademyRegistration> {
  const result = await pool.query(
    `INSERT INTO academy_registrations
       (full_name, email, phone, country, experience_level, motivation)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, full_name, email, phone, country, experience_level, motivation, status, created_at`,
    [
      input.fullName,
      input.email,
      input.phone,
      input.country ?? null,
      input.experienceLevel ?? null,
      input.motivation ?? null,
    ],
  );
  return rowToAcademyRegistration(result.rows[0] as Record<string, unknown>);
}

export async function findAllAcademyRegistrations(): Promise<AdminAcademyRegistration[]> {
  const result = await pool.query(
    `SELECT id, full_name, email, phone, country, experience_level, motivation,
            status, admin_notes, is_read, created_at, updated_at
     FROM academy_registrations
     ORDER BY created_at DESC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToAdminAcademyRegistration);
}

export async function patchAcademyRegistrationIsRead(id: string, isRead: boolean): Promise<boolean> {
  const result = await pool.query(
    `UPDATE academy_registrations SET is_read = $1, updated_at = now() WHERE id = $2 RETURNING id`,
    [isRead, id],
  );
  return result.rows.length > 0;
}

export async function findAcademyRegistrationById(
  id: string,
): Promise<AdminAcademyRegistration | null> {
  const result = await pool.query(
    `SELECT id, full_name, email, phone, country, experience_level, motivation,
            status, admin_notes, is_read, created_at, updated_at
     FROM academy_registrations
     WHERE id = $1`,
    [id],
  );
  if (result.rows.length === 0) return null;
  return rowToAdminAcademyRegistration(result.rows[0] as Record<string, unknown>);
}
