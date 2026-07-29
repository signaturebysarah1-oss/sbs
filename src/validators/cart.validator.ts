import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  variantId: z.string().uuid('variantId must be a valid UUID').nullable().optional(),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
});
