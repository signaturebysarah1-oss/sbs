import { pool } from '../database/pool.js';
import type { Color } from '../types/catalog.types.js';

function rowToColor(row: Record<string, unknown>): Color {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    hexCode: (row['hex_code'] as string | null) ?? null,
    imageUrl: (row['image_url'] as string | null) ?? null,
  };
}

export async function findActiveColors(): Promise<Color[]> {
  const result = await pool.query(
    `SELECT id, name, hex_code, image_url
     FROM colors
     WHERE is_active = true
     ORDER BY name ASC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToColor);
}
