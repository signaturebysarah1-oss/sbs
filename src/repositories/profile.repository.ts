import { pool } from '../database/pool.js';
import type { AuthUser } from '../types/api.types.js';

// Maps a raw database row to the AuthUser shape used throughout the application.
function rowToAuthUser(row: Record<string, unknown>): AuthUser {
  return {
    id: row['id'] as string,
    authUserId: row['auth_user_id'] as string,
    email: row['email'] as string,
    fullName: row['full_name'] as string,
    phone: (row['phone'] as string | null) ?? null,
    avatarUrl: (row['avatar_url'] as string | null) ?? null,
    role: row['role'] as AuthUser['role'],
    isActive: row['is_active'] as boolean,
  };
}

export async function findProfileByAuthUserId(
  authUserId: string,
): Promise<AuthUser | null> {
  const result = await pool.query(
    `SELECT p.id, p.auth_user_id, u.email, p.full_name, p.phone,
            p.avatar_url, p.role, p.is_active
     FROM profiles p
     JOIN auth.users u ON u.id = p.auth_user_id
     WHERE p.auth_user_id = $1
       AND p.is_active = true`,
    [authUserId],
  );

  if (result.rows.length === 0) return null;
  return rowToAuthUser(result.rows[0] as Record<string, unknown>);
}

export async function createProfile(data: {
  authUserId: string;
  fullName: string;
  avatarUrl?: string | null;
}): Promise<AuthUser> {
  const result = await pool.query(
    `INSERT INTO profiles (auth_user_id, full_name, avatar_url)
     VALUES ($1, $2, $3)
     RETURNING id, auth_user_id, full_name, phone, avatar_url, role, is_active`,
    [data.authUserId, data.fullName, data.avatarUrl ?? null],
  );

  // Fetch with email join so the returned shape is complete
  const created = result.rows[0] as Record<string, unknown>;
  const profile = await findProfileByAuthUserId(created['auth_user_id'] as string);

  if (!profile) throw new Error('Profile created but could not be retrieved');
  return profile;
}

export async function updateProfile(
  authUserId: string,
  data: Partial<{ fullName: string; phone: string; avatarUrl: string }>,
): Promise<AuthUser | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.fullName !== undefined) {
    fields.push(`full_name = $${idx++}`);
    values.push(data.fullName);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${idx++}`);
    values.push(data.phone);
  }
  if (data.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${idx++}`);
    values.push(data.avatarUrl);
  }

  if (fields.length === 0) return findProfileByAuthUserId(authUserId);

  values.push(authUserId);

  await pool.query(
    `UPDATE profiles SET ${fields.join(', ')} WHERE auth_user_id = $${idx}`,
    values,
  );

  return findProfileByAuthUserId(authUserId);
}
