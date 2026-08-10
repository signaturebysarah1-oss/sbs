import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid('productId must be a valid UUID').nullable().optional(),
  variantId: z.string().uuid('variantId must be a valid UUID').nullable().optional(),
  materialId: z.string().uuid('materialId must be a valid UUID').nullable().optional(),
  colorId: z.string().uuid('colorId must be a valid UUID').nullable().optional(),
  sizeId: z.string().uuid('sizeId must be a valid UUID').nullable().optional(),
  productNameSnapshot: z.string().trim().min(1).max(500).nullable().optional(),
  imageUrlSnapshot: z.string().url('imageUrlSnapshot must be a valid URL').nullable().optional(),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
  selectedSize: z.number().min(0).max(999.99).nullable().optional(),
  selectedColor: z.string().trim().min(1).max(255).nullable().optional(),
  selectedMaterial: z.string().trim().min(1).max(255).nullable().optional(),
  variantLabelSnapshot: z.string().trim().max(255).nullable().optional(),
  customMeasurements: z.record(z.string(), z.unknown()).nullable().optional(),
  customNotes: z.string().trim().max(10_000).nullable().optional(),
  unitPriceSnapshot: z.number().min(0, 'unitPriceSnapshot must be >= 0'),
});

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(1, 'quantity must be at least 1').optional(),
    selectedSize: z.number().min(0).max(999.99).nullable().optional(),
    selectedColor: z.string().trim().min(1).max(255).nullable().optional(),
    selectedMaterial: z.string().trim().min(1).max(255).nullable().optional(),
    variantLabelSnapshot: z.string().trim().max(255).nullable().optional(),
    customMeasurements: z.record(z.string(), z.unknown()).nullable().optional(),
    customNotes: z.string().trim().max(10_000).nullable().optional(),
  })
  .refine(
    (d) =>
      d.quantity !== undefined ||
      d.selectedSize !== undefined ||
      d.selectedColor !== undefined ||
      d.selectedMaterial !== undefined || d.variantLabelSnapshot !== undefined || d.customMeasurements !== undefined || d.customNotes !== undefined,
    { message: 'At least one field must be provided' },
  );

export const updateCartOrderStatusSchema = z.object({
  status: z.string().trim().min(1, 'status is required').max(50),
  note: z.string().max(1000).nullable().optional(),
});

export const updateCartOrderPaymentSchema = z.object({
  paymentUrl: z.string().url('paymentUrl must be a valid URL').nullable().optional(),
  receiptUrl: z.string().url('receiptUrl must be a valid URL').nullable().optional(),
  receiptPublicId: z.string().trim().max(255).nullable().optional(),
}).refine(
  (d) => d.paymentUrl !== undefined || d.receiptUrl !== undefined || d.receiptPublicId !== undefined,
  'At least one payment field must be provided',
);

export const submitReceiptSchema = z.object({
  receiptUrl: z.string().url('receiptUrl must be a valid URL').nullable().optional(),
  receiptPublicId: z.string().trim().max(255).nullable().optional(),
}).refine(
  (d) => d.receiptUrl !== undefined || d.receiptPublicId !== undefined,
  'receiptUrl or receiptPublicId must be provided',
);

export const updateFulfillmentSchema = z.object({
  shippingTrackingNumber: z.string().trim().max(255).nullable().optional(),
  shippingTrackingUrl: z.string().url('shippingTrackingUrl must be a valid URL').nullable().optional(),
  shippingDetails: z.record(z.string(), z.unknown()).nullable().optional(),
}).refine((d) => Object.values(d).some((value) => value !== undefined), 'At least one fulfillment field must be provided');

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
