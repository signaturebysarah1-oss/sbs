import { pool } from '../database/pool.js';

export interface Setting {
  key: string;
  value: string | null;
  valueJson: unknown | null;
  groupName: string;
  label: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
}

function rowToSetting(row: Record<string, unknown>): Setting {
  return {
    key: row['key'] as string,
    value: (row['value'] as string | null) ?? null,
    valueJson: (row['value_json'] as unknown) ?? null,
    groupName: row['group_name'] as string,
    label: row['label'] as string,
    description: (row['description'] as string | null) ?? null,
    isPublic: row['is_public'] as boolean,
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

export async function findAllSettings(): Promise<Setting[]> {
  const result = await pool.query(
    `SELECT key, value, value_json, group_name, label, description, is_public, updated_at
     FROM settings ORDER BY group_name, key`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToSetting);
}

export async function findSettingByKey(key: string): Promise<Setting | null> {
  const result = await pool.query(
    `SELECT key, value, value_json, group_name, label, description, is_public, updated_at
     FROM settings WHERE key = $1`,
    [key],
  );
  if (result.rows.length === 0) return null;
  return rowToSetting(result.rows[0] as Record<string, unknown>);
}

export async function updateSettingByKey(
  key: string,
  value: string | null | undefined,
  valueJson?: unknown,
): Promise<Setting | null> {
  const result = await pool.query(
    `UPDATE settings
     SET value = CASE WHEN $1 THEN $2 ELSE value END,
         value_json = CASE WHEN $3 THEN $4::jsonb ELSE value_json END,
         updated_at = now()
     WHERE key = $5
     RETURNING key, value, value_json, group_name, label, description, is_public, updated_at`,
    [value !== undefined, value ?? null, valueJson !== undefined, valueJson !== undefined ? JSON.stringify(valueJson) : null, key],
  );
  if (result.rows.length === 0) return null;
  return rowToSetting(result.rows[0] as Record<string, unknown>);
}

// Returns a map of key → value for quick lookups
export async function getSettingsMap(keys: string[]): Promise<Record<string, string | null>> {
  if (keys.length === 0) return {};
  const result = await pool.query(
    `SELECT key, value FROM settings WHERE key = ANY($1::text[])`,
    [keys],
  );
  const map: Record<string, string | null> = {};
  for (const row of result.rows as Record<string, unknown>[]) {
    map[row['key'] as string] = (row['value'] as string | null) ?? null;
  }
  return map;
}
