import { pool } from '../database/pool.js';
import type { Material } from '../types/catalog.types.js';

function rowToMaterial(row: Record<string, unknown>): Material {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    description: (row['description'] as string | null) ?? null,
    imageUrl: (row['image_url'] as string | null) ?? null,
  };
}

export async function findActiveMaterials(): Promise<Material[]> {
  const result = await pool.query(
    `SELECT id, name, description, image_url
     FROM materials
     WHERE is_active = true
     ORDER BY name ASC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToMaterial);
}
