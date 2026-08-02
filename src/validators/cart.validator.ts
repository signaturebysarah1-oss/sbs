import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID'),
  variantId: z.string().uuid('variantId must be a valid UUID').nullable().optional(),
  selectedColor: z.string().trim().min(1).max(255).nullable().optional(),
  selectedMaterial: z.string().trim().min(1).max(255).nullable().optional(),
  selectedSize: z.number().min(0).max(999.99).nullable().optional(),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
});
