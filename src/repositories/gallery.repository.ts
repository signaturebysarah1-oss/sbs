import { pool } from '../database/pool.js';
import type { CreateGalleryImageInput, GalleryImage } from '../types/gallery.types.js';

function rowToGalleryImage(row: Record<string, unknown>): GalleryImage {
  return {
    id: row['id'] as string,
    title: (row['title'] as string | null) ?? null,
    imageUrl: row['image_url'] as string,
    imagePublicId: row['image_public_id'] as string,
    category: row['category'] as GalleryImage['category'],
    sortOrder: row['sort_order'] as number,
    isPublished: row['is_published'] as boolean,
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

export async function findPublishedGalleryImages(): Promise<GalleryImage[]> {
  const result = await pool.query(
    `SELECT id, title, image_url, image_public_id, category, sort_order, is_published,
            created_at, updated_at
     FROM gallery_images
     WHERE is_published = true
     ORDER BY sort_order ASC, created_at DESC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToGalleryImage);
}

export async function createGalleryImage(input: CreateGalleryImageInput): Promise<GalleryImage> {
  const result = await pool.query(
    `INSERT INTO gallery_images (title, image_url, image_public_id, category, sort_order, is_published)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, image_url, image_public_id, category, sort_order, is_published,
               created_at, updated_at`,
    [
      input.title ?? null,
      input.imageUrl,
      input.imagePublicId,
      input.category,
      input.sortOrder ?? 0,
      input.isPublished ?? false,
    ],
  );
  return rowToGalleryImage(result.rows[0] as Record<string, unknown>);
}

export async function deleteGalleryImageById(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM gallery_images WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}
