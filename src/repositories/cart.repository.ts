import { pool } from '../database/pool.js';
import type { Cart, CartItem } from '../types/cart.types.js';

function parseImages(value: unknown): CartItem['product']['images'] {
  if (Array.isArray(value)) {
    return value.map((image) => ({
      id: image['id'] as string,
      imageUrl: image['image_url'] as string,
      imagePublicId: image['image_public_id'] as string,
      altText: (image['alt_text'] as string | null) ?? null,
      sortOrder: image['sort_order'] as number,
      isPrimary: image['is_primary'] as boolean,
    }));
  }
  if (typeof value === 'string') return parseImages(JSON.parse(value) as unknown);
  return [];
}

function rowToCartItem(row: Record<string, unknown>): CartItem {
  return {
    id: row['id'] as string,
    quantity: row['quantity'] as number,
    unitPriceSnapshot: parseFloat(row['unit_price_snapshot'] as string),
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
    product: {
      id: row['product_id'] as string,
      name: row['product_name'] as string,
      slug: row['product_slug'] as string,
      description: (row['product_description'] as string | null) ?? null,
      basePrice: parseFloat(row['product_base_price'] as string),
      images: parseImages(row['images']),
    },
    variant: row['variant_id']
      ? {
          id: row['variant_id'] as string,
          sizeLabel: (row['size_label'] as string | null) ?? null,
          sizeValue: row['size_value'] == null ? null : parseFloat(row['size_value'] as string),
          sku: (row['sku'] as string | null) ?? null,
          priceAdjustment: parseFloat(row['price_adjustment'] as string),
        }
      : null,
  };
}

const CART_ITEMS_QUERY = `
  SELECT ci.id, ci.quantity, ci.unit_price_snapshot, ci.created_at, ci.updated_at,
         p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
         p.description AS product_description, p.base_price AS product_base_price,
         pv.id AS variant_id, pv.size_label, pv.size_value, pv.sku, pv.price_adjustment,
         COALESCE(
           json_agg(jsonb_build_object(
             'id', pi.id, 'image_url', pi.image_url, 'image_public_id', pi.image_public_id,
             'alt_text', pi.alt_text, 'sort_order', pi.sort_order, 'is_primary', pi.is_primary
           ) ORDER BY pi.sort_order ASC) FILTER (WHERE pi.id IS NOT NULL),
           '[]'
         ) AS images
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  LEFT JOIN product_variants pv ON pv.id = ci.variant_id
  LEFT JOIN product_images pi ON pi.product_id = p.id
  WHERE ci.cart_id = $1
  GROUP BY ci.id, p.id, pv.id
  ORDER BY ci.created_at ASC
`;

async function getOrCreateCartId(profileId: string): Promise<string> {
  const result = await pool.query(
    `INSERT INTO carts (profile_id)
     VALUES ($1)
     ON CONFLICT (profile_id) DO NOTHING
     RETURNING id`,
    [profileId],
  );
  if (result.rows.length > 0) {
    return (result.rows[0] as Record<string, unknown>)['id'] as string;
  }
  const existing = await pool.query('SELECT id FROM carts WHERE profile_id = $1', [profileId]);
  return (existing.rows[0] as Record<string, unknown>)['id'] as string;
}

export async function findOrCreateCartByProfileId(profileId: string): Promise<Cart> {
  const cartId = await getOrCreateCartId(profileId);
  const [cartResult, itemsResult] = await Promise.all([
    pool.query('SELECT id, created_at, updated_at FROM carts WHERE id = $1', [cartId]),
    pool.query(CART_ITEMS_QUERY, [cartId]),
  ]);
  const cart = cartResult.rows[0] as Record<string, unknown>;
  return {
    id: cart['id'] as string,
    createdAt: (cart['created_at'] as Date).toISOString(),
    updatedAt: (cart['updated_at'] as Date).toISOString(),
    items: (itemsResult.rows as Record<string, unknown>[]).map(rowToCartItem),
  };
}

export async function addCartItem(
  profileId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
): Promise<Cart | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cartResult = await client.query(
      `INSERT INTO carts (profile_id)
       VALUES ($1)
       ON CONFLICT (profile_id) DO NOTHING
       RETURNING id`,
      [profileId],
    );
    const cartId = cartResult.rows.length > 0
      ? (cartResult.rows[0] as Record<string, unknown>)['id'] as string
      : (await client.query('SELECT id FROM carts WHERE profile_id = $1', [profileId]))
        .rows[0] as Record<string, unknown>['id'] as string;
    await client.query('SELECT id FROM carts WHERE id = $1 FOR UPDATE', [cartId]);

    const productResult = await client.query(
      `SELECT p.base_price, COALESCE(pv.price_adjustment, 0) AS price_adjustment
       FROM products p
       LEFT JOIN product_variants pv ON pv.id = $2 AND pv.product_id = p.id
       WHERE p.id = $1 AND p.deleted_at IS NULL
         AND ($2::uuid IS NULL OR pv.id IS NOT NULL)`,
      [productId, variantId],
    );
    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const priceRow = productResult.rows[0] as Record<string, unknown>;
    const unitPrice = parseFloat(priceRow['base_price'] as string)
      + parseFloat(priceRow['price_adjustment'] as string);

    const existing = await client.query(
      `SELECT id FROM cart_items
       WHERE cart_id = $1 AND product_id = $2 AND variant_id IS NOT DISTINCT FROM $3`,
      [cartId, productId, variantId],
    );
    if (existing.rows.length > 0) {
      await client.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2',
        [quantity, (existing.rows[0] as Record<string, unknown>)['id']],
      );
    } else {
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, unit_price_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [cartId, productId, variantId, quantity, unitPrice],
      );
    }
    await client.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);
    await client.query('COMMIT');
    return findOrCreateCartByProfileId(profileId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateCartItemQuantity(
  profileId: string,
  itemId: string,
  quantity: number,
): Promise<boolean> {
  const result = await pool.query(
    `WITH updated_item AS (
       UPDATE cart_items ci
       SET quantity = $1
       FROM carts c
       WHERE ci.id = $2 AND ci.cart_id = c.id AND c.profile_id = $3
       RETURNING ci.cart_id
     )
     UPDATE carts c
     SET updated_at = now()
     FROM updated_item
     WHERE c.id = updated_item.cart_id
     RETURNING c.id`,
    [quantity, itemId, profileId],
  );
  return result.rows.length > 0;
}

export async function deleteCartItem(profileId: string, itemId: string): Promise<boolean> {
  const result = await pool.query(
    `WITH deleted_item AS (
       DELETE FROM cart_items ci
       USING carts c
       WHERE ci.id = $1 AND ci.cart_id = c.id AND c.profile_id = $2
       RETURNING ci.cart_id
     )
     UPDATE carts c
     SET updated_at = now()
     FROM deleted_item
     WHERE c.id = deleted_item.cart_id
     RETURNING c.id`,
    [itemId, profileId],
  );
  return result.rows.length > 0;
}

export async function clearCart(profileId: string): Promise<void> {
  await pool.query(
    `WITH deleted_items AS (
       DELETE FROM cart_items ci
       USING carts c
       WHERE ci.cart_id = c.id AND c.profile_id = $1
       RETURNING ci.cart_id
     )
     UPDATE carts c
     SET updated_at = now()
     WHERE c.id IN (SELECT DISTINCT cart_id FROM deleted_items)`,
    [profileId],
  );
}
