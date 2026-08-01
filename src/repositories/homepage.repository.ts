import { pool } from '../database/pool.js';
import type { CarouselItem, CreateCarouselItemInput, UpdateCarouselItemInput } from '../types/homepage.types.js';

const fields = 'id, image_url, image_public_id, sort_order, is_active, created_at, updated_at';
function map(row: Record<string, unknown>): CarouselItem {
  return { id: row.id as string, imageUrl: row.image_url as string, imagePublicId: row.image_public_id as string, sortOrder: row.sort_order as number, isActive: row.is_active as boolean, createdAt: (row.created_at as Date).toISOString(), updatedAt: (row.updated_at as Date).toISOString() };
}
export async function findActiveCarouselItems(): Promise<CarouselItem[]> {
  const result = await pool.query(`SELECT ${fields} FROM homepage_carousel_items WHERE is_active = true ORDER BY sort_order ASC, created_at ASC`);
  return (result.rows as Record<string, unknown>[]).map(map);
}

export async function findAllCarouselItems(): Promise<CarouselItem[]> {
  const result = await pool.query(`SELECT ${fields} FROM homepage_carousel_items ORDER BY sort_order ASC, created_at ASC`);
  return (result.rows as Record<string, unknown>[]).map(map);
}
export async function createCarouselItem(input: CreateCarouselItemInput): Promise<CarouselItem> {
  const result = await pool.query(`INSERT INTO homepage_carousel_items (image_url, image_public_id, sort_order, is_active) VALUES ($1, $2, $3, $4) RETURNING ${fields}`, [input.imageUrl, input.imagePublicId, input.sortOrder ?? 0, input.isActive ?? true]);
  return map(result.rows[0] as Record<string, unknown>);
}
export async function updateCarouselItemById(id: string, input: UpdateCarouselItemInput): Promise<CarouselItem | null> {
  const columns: Record<keyof UpdateCarouselItemInput, string> = { imageUrl: 'image_url', imagePublicId: 'image_public_id', sortOrder: 'sort_order', isActive: 'is_active' };
  const entries = (Object.entries(input) as [keyof UpdateCarouselItemInput, unknown][]).filter(([, value]) => value !== undefined);
  const result = await pool.query(`UPDATE homepage_carousel_items SET ${entries.map(([key], i) => `${columns[key]} = $${i + 1}`).join(', ')} WHERE id = $${entries.length + 1} RETURNING ${fields}`, [...entries.map(([, value]) => value), id]);
  return result.rows[0] ? map(result.rows[0] as Record<string, unknown>) : null;
}
export async function deleteCarouselItemById(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM homepage_carousel_items WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}
