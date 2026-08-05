import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID').nullable().optional(),
  productNameSnapshot: z.string().trim().min(1).max(500).nullable().optional(),
  imageUrlSnapshot: z.string().url('imageUrlSnapshot must be a valid URL').nullable().optional(),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
  selectedSize: z.number().min(0).max(999.99).nullable().optional(),
  selectedColor: z.string().trim().min(1).max(255).nullable().optional(),
  selectedMaterial: z.string().trim().min(1).max(255).nullable().optional(),
  unitPriceSnapshot: z.number().min(0, 'unitPriceSnapshot must be >= 0'),
});

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(1, 'quantity must be at least 1').optional(),
    selectedSize: z.number().min(0).max(999.99).nullable().optional(),
    selectedColor: z.string().trim().min(1).max(255).nullable().optional(),
    selectedMaterial: z.string().trim().min(1).max(255).nullable().optional(),
  })
  .refine(
    (d) =>
      d.quantity !== undefined ||
      d.selectedSize !== undefined ||
      d.selectedColor !== undefined ||
      d.selectedMaterial !== undefined,
    { message: 'At least one field must be provided' },
  );

export const submitCartSchema = z.object({
  contactMethod: z.enum(['email', 'whatsapp'], {
    error: "contactMethod must be 'email' or 'whatsapp'",
  }),
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'phoneNumber must be at least 7 characters')
    .max(20, 'phoneNumber must be at most 20 characters')
    .nullable()
    .optional(),
});
