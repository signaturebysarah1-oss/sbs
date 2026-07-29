import { pool } from '../database/pool.js';
import type {
  Product,
  ProductSummary,
  ProductImage,
  CollectionRef,
  MaterialRef,
  ColorRef,
  ProductVariant,
} from '../types/catalog.types.js';
import type {
  AdminProduct,
  CreateProductImageInput,
  CreateProductInput,
  ManagedProductImage,
  CreateProductVariantInput,
  ManagedProductVariant,
  UpdateProductInput,
  UpdateProductVariantInput,
} from '../types/admin-catalog.types.js';

// ─── Row mappers ──────────────────────────────────────────────────────────────

function parseJsonAgg<T>(value: unknown): T[] {
  if (!value || value === '[null]') return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  }
  return [];
}

function rowToProductSummary(row: Record<string, unknown>): ProductSummary {
  const images = parseJsonAgg<ProductImage>(row['images']);
  const collections = parseJsonAgg<CollectionRef>(row['collections']);
  const materials = parseJsonAgg<MaterialRef>(row['materials']);
  const colors = parseJsonAgg<ColorRef>(row['colors']);

  return {
    id: row['id'] as string,
    name: row['name'] as string,
    slug: row['slug'] as string,
    description: (row['description'] as string | null) ?? null,
    basePrice: parseFloat(row['base_price'] as string),
    isCustomizable: row['is_customizable'] as boolean,
    isFeatured: row['is_featured'] as boolean,
    isHero: row['is_hero'] as boolean,
    sortOrder: row['sort_order'] as number,
    metaTitle: (row['meta_title'] as string | null) ?? null,
    metaDescription: (row['meta_description'] as string | null) ?? null,
    images: images.map((img) => ({
      id: img['id' as keyof typeof img] as unknown as string,
      imageUrl: img['image_url' as keyof typeof img] as unknown as string,
      imagePublicId: img['image_public_id' as keyof typeof img] as unknown as string,
      altText: (img['alt_text' as keyof typeof img] as unknown as string | null) ?? null,
      sortOrder: img['sort_order' as keyof typeof img] as unknown as number,
      isPrimary: img['is_primary' as keyof typeof img] as unknown as boolean,
    })),
    collections: collections.map((c) => ({
      id: c['id' as keyof typeof c] as unknown as string,
      name: c['name' as keyof typeof c] as unknown as string,
      slug: c['slug' as keyof typeof c] as unknown as string,
    })),
    materials: materials.map((m) => ({
      id: m['id' as keyof typeof m] as unknown as string,
      name: m['name' as keyof typeof m] as unknown as string,
    })),
    colors: colors.map((col) => ({
      id: col['id' as keyof typeof col] as unknown as string,
      name: col['name' as keyof typeof col] as unknown as string,
      hexCode: (col['hex_code' as keyof typeof col] as unknown as string | null) ?? null,
    })),
  };
}

function rowToProduct(row: Record<string, unknown>): Product {
  const summary = rowToProductSummary(row);
  const variants = parseJsonAgg<Record<string, unknown>>(row['variants']);

  return {
    ...summary,
    variants: variants.map(
      (v): ProductVariant => ({
        id: v['id'] as string,
        sizeLabel: (v['size_label'] as string | null) ?? null,
        sizeValue: v['size_value'] != null ? parseFloat(v['size_value'] as string) : null,
        sku: (v['sku'] as string | null) ?? null,
        priceAdjustment: parseFloat(v['price_adjustment'] as string),
        isAvailable: v['is_available'] as boolean,
        sortOrder: v['sort_order'] as number,
        color:
          v['color_id'] != null
            ? {
                id: v['color_id'] as string,
                name: v['color_name'] as string,
                hexCode: (v['color_hex'] as string | null) ?? null,
              }
            : null,
      }),
    ),
  };
}

// ─── Shared SQL fragments ─────────────────────────────────────────────────────

// Aggregates all related data for a product into JSON arrays.
// Used in every SELECT to avoid N+1 queries.
const PRODUCT_AGGREGATES = `
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id',               pi.id,
      'image_url',        pi.image_url,
      'image_public_id',  pi.image_public_id,
      'alt_text',         pi.alt_text,
      'sort_order',       pi.sort_order,
      'is_primary',       pi.is_primary
    )) FILTER (WHERE pi.id IS NOT NULL),
    '[]'
  ) AS images,

  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id',   c.id,
      'name', c.name,
      'slug', c.slug
    )) FILTER (WHERE c.id IS NOT NULL),
    '[]'
  ) AS collections,

  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id',   m.id,
      'name', m.name
    )) FILTER (WHERE m.id IS NOT NULL),
    '[]'
  ) AS materials,

  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id',       col.id,
      'name',     col.name,
      'hex_code', col.hex_code
    )) FILTER (WHERE col.id IS NOT NULL),
    '[]'
  ) AS colors
`;

const PRODUCT_JOINS = `
  LEFT JOIN product_images pi        ON pi.product_id = p.id
  LEFT JOIN product_collections pc   ON pc.product_id = p.id
  LEFT JOIN collections c            ON c.id = pc.collection_id AND c.status = 'published'
  LEFT JOIN product_materials pm     ON pm.product_id = p.id
  LEFT JOIN materials m              ON m.id = pm.material_id AND m.is_active = true
  LEFT JOIN product_colors pcol      ON pcol.product_id = p.id
  LEFT JOIN colors col               ON col.id = pcol.color_id AND col.is_active = true
`;

const PRODUCT_VARIANT_AGGREGATE = `
  COALESCE(
    json_agg(
      jsonb_build_object(
        'id',               pv.id,
        'size_label',       pv.size_label,
        'size_value',       pv.size_value,
        'sku',              pv.sku,
        'price_adjustment', pv.price_adjustment,
        'is_available',     pv.is_available,
        'sort_order',       pv.sort_order,
        'color_id',         vc.id,
        'color_name',       vc.name,
        'color_hex',        vc.hex_code
      ) ORDER BY pv.sort_order ASC
    ) FILTER (WHERE pv.id IS NOT NULL),
    '[]'
  ) AS variants
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function findPublishedProducts(): Promise<ProductSummary[]> {
  const result = await pool.query(
    `SELECT
       p.id, p.name, p.slug, p.description, p.base_price,
       p.is_customizable, p.is_featured, p.is_hero, p.sort_order,
       p.meta_title, p.meta_description,
       ${PRODUCT_AGGREGATES}
     FROM products p
     ${PRODUCT_JOINS}
     WHERE p.status = 'published'
       AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.sort_order ASC, p.name ASC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToProductSummary);
}

export async function findProductBySlug(slug: string): Promise<Product | null> {
  const result = await pool.query(
    `SELECT
       p.id, p.name, p.slug, p.description, p.base_price,
       p.is_customizable, p.is_featured, p.is_hero, p.sort_order,
       p.meta_title, p.meta_description,
       ${PRODUCT_AGGREGATES},
       ${PRODUCT_VARIANT_AGGREGATE}
     FROM products p
     ${PRODUCT_JOINS}
     LEFT JOIN product_variants pv ON pv.product_id = p.id
     LEFT JOIN colors vc           ON vc.id = pv.color_id
     WHERE p.slug = $1
       AND p.status = 'published'
       AND p.deleted_at IS NULL
     GROUP BY p.id`,
    [slug],
  );
  if (result.rows.length === 0) return null;
  return rowToProduct(result.rows[0] as Record<string, unknown>);
}

export async function findFeaturedProducts(): Promise<ProductSummary[]> {
  const result = await pool.query(
    `SELECT
       p.id, p.name, p.slug, p.description, p.base_price,
       p.is_customizable, p.is_featured, p.is_hero, p.sort_order,
       p.meta_title, p.meta_description,
       ${PRODUCT_AGGREGATES}
     FROM products p
     ${PRODUCT_JOINS}
     WHERE p.is_featured = true
       AND p.status = 'published'
       AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.sort_order ASC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToProductSummary);
}

export async function findHeroProducts(): Promise<ProductSummary[]> {
  const result = await pool.query(
    `SELECT
       p.id, p.name, p.slug, p.description, p.base_price,
       p.is_customizable, p.is_featured, p.is_hero, p.sort_order,
       p.meta_title, p.meta_description,
       ${PRODUCT_AGGREGATES}
     FROM products p
     ${PRODUCT_JOINS}
     WHERE p.is_hero = true
       AND p.status = 'published'
       AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.sort_order ASC`,
  );
  return (result.rows as Record<string, unknown>[]).map(rowToProductSummary);
}

export async function findPublishedProductsByIds(ids: string[]): Promise<ProductSummary[]> {
  if (ids.length === 0) return [];
  const result = await pool.query(
    `SELECT
       p.id, p.name, p.slug, p.description, p.base_price,
       p.is_customizable, p.is_featured, p.is_hero, p.sort_order,
       p.meta_title, p.meta_description,
       ${PRODUCT_AGGREGATES}
     FROM products p
     ${PRODUCT_JOINS}
     WHERE p.id = ANY($1::uuid[])
       AND p.status = 'published'
       AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.sort_order ASC`,
    [ids],
  );
  return (result.rows as Record<string, unknown>[]).map(rowToProductSummary);
}

// ─── Admin mutations ─────────────────────────────────────────────────────────

function rowToAdminProduct(row: Record<string, unknown>): AdminProduct {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    slug: row['slug'] as string,
    description: (row['description'] as string | null) ?? null,
    basePrice: parseFloat(row['base_price'] as string),
    isCustomizable: row['is_customizable'] as boolean,
    status: row['status'] as AdminProduct['status'],
    isFeatured: row['is_featured'] as boolean,
    isHero: row['is_hero'] as boolean,
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

function rowToManagedProductImage(row: Record<string, unknown>): ManagedProductImage {
  return {
    id: row['id'] as string,
    imageUrl: row['image_url'] as string,
    imagePublicId: row['image_public_id'] as string,
    altText: (row['alt_text'] as string | null) ?? null,
    sortOrder: row['sort_order'] as number,
    isPrimary: row['is_primary'] as boolean,
  };
}

export async function createProduct(input: CreateProductInput): Promise<AdminProduct> {
  const result = await pool.query(
    `INSERT INTO products
       (name, slug, description, base_price, is_customizable, status, is_featured, is_hero)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name, slug, description, base_price, is_customizable, status,
               is_featured, is_hero, created_at, updated_at`,
    [
      input.name,
      input.slug,
      input.description,
      input.basePrice,
      input.isCustomizable,
      input.status,
      input.isFeatured,
      input.isHero,
    ],
  );
  return rowToAdminProduct(result.rows[0] as Record<string, unknown>);
}

export async function updateProductById(
  id: string,
  input: UpdateProductInput,
): Promise<AdminProduct | null> {
  const fieldMap: Record<keyof UpdateProductInput, string> = {
    name: 'name', slug: 'slug', description: 'description', basePrice: 'base_price',
    isCustomizable: 'is_customizable', status: 'status', isFeatured: 'is_featured', isHero: 'is_hero',
  };
  const entries = (Object.entries(input) as [keyof UpdateProductInput, unknown][])
    .filter(([, value]) => value !== undefined);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${fieldMap[key]} = $${index + 1}`);

  const result = await pool.query(
    `UPDATE products
     SET ${assignments.join(', ')}
     WHERE id = $${values.length + 1} AND deleted_at IS NULL
     RETURNING id, name, slug, description, base_price, is_customizable, status,
               is_featured, is_hero, created_at, updated_at`,
    [...values, id],
  );
  if (result.rows.length === 0) return null;
  return rowToAdminProduct(result.rows[0] as Record<string, unknown>);
}

export async function softDeleteProductById(id: string): Promise<boolean> {
  const result = await pool.query(
    'UPDATE products SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
    [id],
  );
  return result.rows.length > 0;
}

export async function createProductImage(
  productId: string,
  input: CreateProductImageInput,
): Promise<ManagedProductImage | null> {
  const result = await pool.query(
    `INSERT INTO product_images
       (product_id, image_url, image_public_id, alt_text, sort_order, is_primary)
     SELECT $1, $2, $3, $4, $5, $6
     WHERE EXISTS (SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL)
     RETURNING id, image_url, image_public_id, alt_text, sort_order, is_primary`,
    [
      productId,
      input.imageUrl,
      input.imagePublicId,
      input.altText ?? null,
      input.sortOrder ?? 0,
      input.isPrimary ?? false,
    ],
  );
  if (result.rows.length === 0) return null;
  return rowToManagedProductImage(result.rows[0] as Record<string, unknown>);
}

export async function deleteProductImageById(productId: string, imageId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING id',
    [imageId, productId],
  );
  return result.rows.length > 0;
}

function rowToManagedProductVariant(row: Record<string, unknown>): ManagedProductVariant {
  return {
    id: row['id'] as string,
    productId: row['product_id'] as string,
    colorId: (row['color_id'] as string | null) ?? null,
    sizeLabel: (row['size_label'] as string | null) ?? null,
    sizeValue: row['size_value'] == null ? null : parseFloat(row['size_value'] as string),
    sku: (row['sku'] as string | null) ?? null,
    priceAdjustment: parseFloat(row['price_adjustment'] as string),
    isAvailable: row['is_available'] as boolean,
    sortOrder: row['sort_order'] as number,
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

export async function assignProductToCollection(productId: string, collectionId: string): Promise<boolean> {
  const result = await pool.query(
    `INSERT INTO product_collections (product_id, collection_id)
     SELECT $1, $2
     WHERE EXISTS (SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL)
       AND EXISTS (SELECT 1 FROM collections WHERE id = $2)
     ON CONFLICT (product_id, collection_id) DO NOTHING
     RETURNING product_id`,
    [productId, collectionId],
  );
  return result.rows.length > 0;
}

export async function removeProductFromCollection(productId: string, collectionId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM product_collections
     WHERE product_id = $1 AND collection_id = $2
     RETURNING product_id`,
    [productId, collectionId],
  );
  return result.rows.length > 0;
}

export async function createProductVariant(
  productId: string,
  input: CreateProductVariantInput,
): Promise<ManagedProductVariant | null> {
  const result = await pool.query(
    `INSERT INTO product_variants
       (product_id, color_id, size_label, size_value, sku, price_adjustment, is_available, sort_order)
     SELECT $1, $2, $3, $4, $5, $6, $7, $8
     WHERE EXISTS (SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL)
     RETURNING id, product_id, color_id, size_label, size_value, sku, price_adjustment,
               is_available, sort_order, created_at, updated_at`,
    [
      productId,
      input.colorId ?? null,
      input.sizeLabel ?? null,
      input.sizeValue ?? null,
      input.sku ?? null,
      input.priceAdjustment ?? 0,
      input.isAvailable ?? true,
      input.sortOrder ?? 0,
    ],
  );
  if (result.rows.length === 0) return null;
  return rowToManagedProductVariant(result.rows[0] as Record<string, unknown>);
}

export async function updateProductVariantById(
  productId: string,
  variantId: string,
  input: UpdateProductVariantInput,
): Promise<ManagedProductVariant | null> {
  const fieldMap: Record<keyof UpdateProductVariantInput, string> = {
    sizeLabel: 'size_label', sizeValue: 'size_value', sku: 'sku',
    priceAdjustment: 'price_adjustment', colorId: 'color_id',
    isAvailable: 'is_available', sortOrder: 'sort_order',
  };
  const entries = (Object.entries(input) as [keyof UpdateProductVariantInput, unknown][])
    .filter(([, value]) => value !== undefined);
  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([key], index) => `${fieldMap[key]} = $${index + 1}`);
  const result = await pool.query(
    `UPDATE product_variants
     SET ${assignments.join(', ')}
     WHERE id = $${values.length + 1} AND product_id = $${values.length + 2}
     RETURNING id, product_id, color_id, size_label, size_value, sku, price_adjustment,
               is_available, sort_order, created_at, updated_at`,
    [...values, variantId, productId],
  );
  if (result.rows.length === 0) return null;
  return rowToManagedProductVariant(result.rows[0] as Record<string, unknown>);
}

export async function deleteProductVariantById(productId: string, variantId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM product_variants WHERE id = $1 AND product_id = $2 RETURNING id',
    [variantId, productId],
  );
  return result.rows.length > 0;
}
