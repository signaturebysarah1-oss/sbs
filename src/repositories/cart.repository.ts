import { pool } from '../database/pool.js';
import type {
  AddCartItemInput,
  Cart,
  CartHistory,
  CartItem,
  UpdateCartItemInput,
} from '../types/cart.types.js';

function rowToCartItem(row: Record<string, unknown>): CartItem {
  return {
    id: row['id'] as string,
    cartId: row['cart_id'] as string,
    productId: (row['product_id'] as string | null) ?? null,
    productNameSnapshot: (row['product_name_snapshot'] as string | null) ?? null,
    imageUrlSnapshot: (row['image_url_snapshot'] as string | null) ?? null,
    quantity: row['quantity'] as number,
    selectedSize:
      row['selected_size'] == null ? null : parseFloat(row['selected_size'] as string),
    selectedColor: (row['selected_color'] as string | null) ?? null,
    selectedMaterial: (row['selected_material'] as string | null) ?? null,
    unitPriceSnapshot: parseFloat(row['unit_price_snapshot'] as string),
    createdAt: (row['created_at'] as Date).toISOString(),
    updatedAt: (row['updated_at'] as Date).toISOString(),
  };
}

function rowToCart(cartRow: Record<string, unknown>, items: CartItem[]): Cart {
  return {
    id: cartRow['id'] as string,
    profileId: cartRow['profile_id'] as string,
    status: cartRow['status'] as Cart['status'],
    items,
    createdAt: (cartRow['created_at'] as Date).toISOString(),
    updatedAt: (cartRow['updated_at'] as Date).toISOString(),
  };
}

async function fetchCartItems(cartId: string): Promise<CartItem[]> {
  const result = await pool.query(
    `SELECT id, cart_id, product_id, product_name_snapshot, image_url_snapshot,
            quantity, selected_size, selected_color, selected_material,
            unit_price_snapshot, created_at, updated_at
     FROM cart_items
     WHERE cart_id = $1
     ORDER BY created_at ASC`,
    [cartId],
  );
  return (result.rows as Record<string, unknown>[]).map(rowToCartItem);
}

export async function findActiveCartByProfileId(profileId: string): Promise<Cart | null> {
  const result = await pool.query(
    `SELECT id, profile_id, status, created_at, updated_at
     FROM carts WHERE profile_id = $1 AND status = 'active'`,
    [profileId],
  );
  if (result.rows.length === 0) return null;
  const cartRow = result.rows[0] as Record<string, unknown>;
  const items = await fetchCartItems(cartRow['id'] as string);
  return rowToCart(cartRow, items);
}

export async function findOrCreateActiveCart(profileId: string): Promise<Cart> {
  const existing = await findActiveCartByProfileId(profileId);
  if (existing) return existing;

  const result = await pool.query(
    `INSERT INTO carts (profile_id, status) VALUES ($1, 'active') RETURNING id, profile_id, status, created_at, updated_at`,
    [profileId],
  );
  return rowToCart(result.rows[0] as Record<string, unknown>, []);
}

export async function addItemToActiveCart(
  profileId: string,
  input: AddCartItemInput,
): Promise<Cart> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get or create active cart with row lock
    let cartRow: Record<string, unknown>;
    const existing = await client.query(
      `SELECT id, profile_id, status, created_at, updated_at
       FROM carts WHERE profile_id = $1 AND status = 'active' FOR UPDATE`,
      [profileId],
    );
    if (existing.rows.length > 0) {
      cartRow = existing.rows[0] as Record<string, unknown>;
    } else {
      const created = await client.query(
        `INSERT INTO carts (profile_id, status) VALUES ($1, 'active')
         RETURNING id, profile_id, status, created_at, updated_at`,
        [profileId],
      );
      cartRow = created.rows[0] as Record<string, unknown>;
    }
    const cartId = cartRow['id'] as string;

    // Check for duplicate: same product + size + color + material
    const dupResult = await client.query(
      `SELECT id, quantity FROM cart_items
       WHERE cart_id = $1
         AND product_id IS NOT DISTINCT FROM $2
         AND selected_size IS NOT DISTINCT FROM $3
         AND lower(COALESCE(selected_color, '')) = lower(COALESCE($4, ''))
         AND lower(COALESCE(selected_material, '')) = lower(COALESCE($5, ''))`,
      [
        cartId,
        input.productId ?? null,
        input.selectedSize ?? null,
        input.selectedColor ?? null,
        input.selectedMaterial ?? null,
      ],
    );

    if (dupResult.rows.length > 0) {
      const existingItem = dupResult.rows[0] as Record<string, unknown>;
      await client.query(
        'UPDATE cart_items SET quantity = quantity + $1, updated_at = now() WHERE id = $2',
        [input.quantity, existingItem['id']],
      );
    } else {
      await client.query(
        `INSERT INTO cart_items
           (cart_id, product_id, product_name_snapshot, image_url_snapshot,
            quantity, selected_size, selected_color, selected_material, unit_price_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          cartId,
          input.productId ?? null,
          input.productNameSnapshot ?? null,
          input.imageUrlSnapshot ?? null,
          input.quantity,
          input.selectedSize ?? null,
          input.selectedColor ?? null,
          input.selectedMaterial ?? null,
          input.unitPriceSnapshot,
        ],
      );
    }

    await client.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);
    await client.query('COMMIT');

    const items = await fetchCartItems(cartId);
    return rowToCart(cartRow, items);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateCartItem(
  profileId: string,
  itemId: string,
  input: UpdateCartItemInput,
): Promise<boolean> {
  const setClauses: string[] = ['updated_at = now()'];
  const values: unknown[] = [];
  let idx = 1;

  if (input.quantity !== undefined) {
    setClauses.push(`quantity = $${idx++}`);
    values.push(input.quantity);
  }
  if (input.selectedSize !== undefined) {
    setClauses.push(`selected_size = $${idx++}`);
    values.push(input.selectedSize);
  }
  if (input.selectedColor !== undefined) {
    setClauses.push(`selected_color = $${idx++}`);
    values.push(input.selectedColor);
  }
  if (input.selectedMaterial !== undefined) {
    setClauses.push(`selected_material = $${idx++}`);
    values.push(input.selectedMaterial);
  }

  values.push(itemId, profileId);
  const result = await pool.query(
    `UPDATE cart_items ci
     SET ${setClauses.join(', ')}
     FROM carts c
     WHERE ci.id = $${idx} AND ci.cart_id = c.id AND c.profile_id = $${idx + 1} AND c.status = 'active'
     RETURNING ci.id`,
    values,
  );
  return result.rows.length > 0;
}

export async function deleteCartItem(profileId: string, itemId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.id = $1 AND ci.cart_id = c.id AND c.profile_id = $2 AND c.status = 'active'
     RETURNING ci.id`,
    [itemId, profileId],
  );
  if (result.rows.length > 0) {
    await pool.query(
      `UPDATE carts SET updated_at = now()
       WHERE profile_id = $1 AND status = 'active'`,
      [profileId],
    );
  }
  return result.rows.length > 0;
}

export async function clearActiveCart(profileId: string): Promise<void> {
  await pool.query(
    `DELETE FROM cart_items ci
     USING carts c
     WHERE ci.cart_id = c.id AND c.profile_id = $1 AND c.status = 'active'`,
    [profileId],
  );
  await pool.query(
    `UPDATE carts SET updated_at = now() WHERE profile_id = $1 AND status = 'active'`,
    [profileId],
  );
}

export async function submitActiveCart(
  profileId: string,
): Promise<{ submittedCartId: string; historyId: string; newActiveCartId: string }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the active cart row to prevent concurrent submissions
    const cartResult = await client.query(
      `SELECT id FROM carts WHERE profile_id = $1 AND status = 'active' FOR UPDATE`,
      [profileId],
    );
    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return Promise.reject(new Error('NO_ACTIVE_CART'));
    }
    const cartId = (cartResult.rows[0] as Record<string, unknown>)['id'] as string;

    // Read all cart items
    const itemsResult = await client.query(
      `SELECT product_id, product_name_snapshot, image_url_snapshot,
              quantity, selected_size, selected_color, selected_material, unit_price_snapshot
       FROM cart_items WHERE cart_id = $1`,
      [cartId],
    );
    const items = (itemsResult.rows as Record<string, unknown>[]).map((r) => ({
      productId: (r['product_id'] as string | null) ?? null,
      productNameSnapshot: (r['product_name_snapshot'] as string | null) ?? null,
      imageUrlSnapshot: (r['image_url_snapshot'] as string | null) ?? null,
      quantity: r['quantity'] as number,
      selectedSize: r['selected_size'] == null ? null : parseFloat(r['selected_size'] as string),
      selectedColor: (r['selected_color'] as string | null) ?? null,
      selectedMaterial: (r['selected_material'] as string | null) ?? null,
      unitPriceSnapshot: parseFloat(r['unit_price_snapshot'] as string),
    }));

    const totalSnapshot = items.reduce(
      (sum, item) => sum + item.unitPriceSnapshot * item.quantity,
      0,
    );

    // Write history snapshot
    const historyResult = await client.query(
      `INSERT INTO cart_history (original_cart_id, profile_id, items, total_snapshot, completed_at)
       VALUES ($1, $2, $3, $4, now())
       RETURNING id`,
      [cartId, profileId, JSON.stringify(items), totalSnapshot],
    );
    const historyId = (historyResult.rows[0] as Record<string, unknown>)['id'] as string;

    // Mark current cart as submitted
    await client.query(
      `UPDATE carts SET status = 'submitted', updated_at = now() WHERE id = $1`,
      [cartId],
    );

    // Create a new empty active cart
    const newCartResult = await client.query(
      `INSERT INTO carts (profile_id, status) VALUES ($1, 'active') RETURNING id`,
      [profileId],
    );
    const newActiveCartId = (newCartResult.rows[0] as Record<string, unknown>)['id'] as string;

    await client.query('COMMIT');
    return { submittedCartId: cartId, historyId, newActiveCartId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function findCartHistoryByProfileId(profileId: string): Promise<CartHistory[]> {
  const result = await pool.query(
    `SELECT id, original_cart_id, profile_id, items, total_snapshot, completed_at, created_at
     FROM cart_history
     WHERE profile_id = $1
     ORDER BY completed_at DESC`,
    [profileId],
  );
  return (result.rows as Record<string, unknown>[]).map((row) => ({
    id: row['id'] as string,
    originalCartId: (row['original_cart_id'] as string | null) ?? null,
    profileId: row['profile_id'] as string,
    items: row['items'] as CartHistory['items'],
    totalSnapshot: parseFloat(row['total_snapshot'] as string),
    completedAt: (row['completed_at'] as Date).toISOString(),
    createdAt: (row['created_at'] as Date).toISOString(),
  }));
}
