import { pool } from '../database/pool.js';
import type { Collection, CollectionWithProducts, ProductSummary } from '../types/catalog.types.js';
import type {
  AdminCollection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '../types/admin-catalog.types.js';

function rowToCollection(row: Record<string, unknown>): Collection {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    slug: row['slug'] as string,
    description: (row['description'] as string | null) ?? null,
    imageUrl: (row['image_url'] as string | null) ?? null,
    imagePublicId: (row['image_public_id'] as string | null) ?? null,
    status: row['status'] as string,
    sortOrder: row['sort_order'] as number,
    productCount: parseInt(row['product_count'] as string, 10),
  };
}

export async function findPublishedCollections(): Promise<Collection[]> {
  const result = await pool.query(
    `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.image_public_id,
            c.status, c.sort_order,
            COUNT(pc.product_id) FILTER (
              WHERE p.status = 'published' AND p.deleted_at IS NULL
            ) AS product_count
     FROM collections c
     LEFT JOIN product_collections pc ON pc.collection_id = c.id
     LEFT JOIN products p ON p.id = pc.product_id
     WHERE c.status = 'published'
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToCollection);
}

export async function findCollectionBySlug(slug: string): Promise<Collection | null> {
  const result = await pool.query(
    `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.image_public_id,
            c.status, c.sort_order,
            COUNT(pc.product_id) FILTER (
              WHERE p.status = 'published' AND p.deleted_at IS NULL
            ) AS product_count
     FROM collections c
     LEFT JOIN product_collections pc ON pc.collection_id = c.id
     LEFT JOIN products p ON p.id = pc.product_id
     WHERE c.slug = $1
       AND c.status = 'published'
     GROUP BY c.id`,
    [slug],
  );
  if (result.rows.length === 0) return null;
  return rowToCollection(result.rows[0] as Record<string, unknown>);
}

// Returns the IDs of published products in a collection, ordered by sort_order.
// The product repository uses these IDs to fetch full product summaries.
export async function findProductIdsByCollectionSlug(slug: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT pc.product_id
     FROM product_collections pc
     JOIN collections c ON c.id = pc.collection_id
     JOIN products p ON p.id = pc.product_id
     WHERE c.slug = $1
       AND c.status = 'published'
       AND p.status = 'published'
       AND p.deleted_at IS NULL
     ORDER BY pc.sort_order ASC`,
    [slug],
  );
  return (result.rows as Record<string, unknown>[]).map((r) => r['product_id'] as string);
}

export async function buildCollectionWithProducts(
  collection: Collection,
  products: ProductSummary[],
): Promise<CollectionWithProducts> {
  return { ...collection, products };
}

// ─── Admin mutations ─────────────────────────────────────────────────────────

function rowToAdminCollection(row: Record<string, unknown>): AdminCollection {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    slug: row['slug'] as string,
    description: (row['description'] as string | null) ?? null,
    imageUrl: (row['image_url'] as string | null) ?? null,
    imagePublicId: (row['image_public_id'] as string | null) ?? null,
    status: row['status'] as AdminCollection['status'],
    sortOrder: row['sort_order'] as number,
    productCount: parseInt(row['product_count'] as string, 10),
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

const ADMIN_COLLECTION_RETURNING = `
  id, name, slug, description, image_url, image_public_id, status, sort_order,
  0::bigint AS product_count, created_at, updated_at
`;

export async function createCollection(input: CreateCollectionInput): Promise<AdminCollection> {
  const result = await pool.query(
    `INSERT INTO collections
       (name, slug, description, image_url, image_public_id, status, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${ADMIN_COLLECTION_RETURNING}`,
    [
      input.name,
      input.slug,
      input.description ?? null,
      input.imageUrl ?? null,
      input.imagePublicId ?? null,
      input.status,
      input.sortOrder ?? 0,
    ],
  );
  return rowToAdminCollection(result.rows[0] as Record<string, unknown>);
}

export async function updateCollectionById(
  id: string,
  input: UpdateCollectionInput,
): Promise<AdminCollection | null> {
  const fieldMap: Record<keyof UpdateCollectionInput, string> = {
    name: 'name', slug: 'slug', description: 'description', imageUrl: 'image_url',
    imagePublicId: 'image_public_id', status: 'status', sortOrder: 'sort_order',
  };
  const entries = (Object.entries(input) as [keyof UpdateCollectionInput, unknown][])
    .filter(([, value]) => value !== undefined);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${fieldMap[key]} = $${index + 1}`);

  const result = await pool.query(
    `UPDATE collections
     SET ${assignments.join(', ')}
     WHERE id = $${values.length + 1}
     RETURNING ${ADMIN_COLLECTION_RETURNING}`,
    [...values, id],
  );
  if (result.rows.length === 0) return null;
  return rowToAdminCollection(result.rows[0] as Record<string, unknown>);
}

export async function deleteCollectionById(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM collections WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}
