import { z } from 'zod';
import { CUSTOMER_QUOTE_STATUSES, QUOTE_STATUSES } from '../types/quote.types.js';

const quoteItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1).max(255).nullable().optional(),
  productNameSnapshot: z.string().min(1).max(255).nullable().optional(),
  imageUrlSnapshot: z.string().trim().min(1).nullable().optional(),
  shoeNameSnapshot: z.string().trim().max(255).nullable().optional(),
  toeStyleSnapshot: z.string().trim().max(255).nullable().optional(),
  variantLabelSnapshot: z.string().nullable().optional(),
  size: z.number().min(0).max(999.99).nullable().optional(),
  material: z.string().min(1).max(255).nullable().optional(),
  materialNameSnapshot: z.string().nullable().optional(),
  color: z.string().min(1).max(255).nullable().optional(),
  colorNameSnapshot: z.string().nullable().optional(),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
  unitPriceSnapshot: z.number().min(0, 'unitPriceSnapshot must be >= 0').nullable().optional(),
  customMeasurements: z.record(z.string(), z.unknown()).nullable().optional(),
  customNotes: z.string().max(1000).nullable().optional(),
}).transform((item) => ({
  productId: item.productId,
  productNameSnapshot: item.productNameSnapshot ?? item.productName ?? null,
  imageUrlSnapshot: item.imageUrlSnapshot ?? null,
  shoeNameSnapshot: item.shoeNameSnapshot ?? null,
  toeStyleSnapshot: item.toeStyleSnapshot ?? null,
  size: item.size ?? null,
  variantLabelSnapshot: item.variantLabelSnapshot ?? (item.size == null ? null : String(item.size)),
  materialNameSnapshot: item.materialNameSnapshot ?? item.material ?? null,
  colorNameSnapshot: item.colorNameSnapshot ?? item.color ?? null,
  quantity: item.quantity,
  unitPriceSnapshot: item.unitPriceSnapshot ?? null,
  customMeasurements: item.customMeasurements ?? null,
  customNotes: item.customNotes ?? null,
}));

export const createQuoteSchema = z.object({
  guestName: z.string().trim().min(1, 'guestName is required').max(255).optional(),
  guestEmail: z.string().trim().email('guestEmail must be a valid email address').max(255).optional(),
  guestPhone: z.string().trim().min(1, 'guestPhone is required').max(50).optional(),
  customerNotes: z.string().max(2000).nullable().optional(),
  items: z
    .array(quoteItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Maximum 50 items per quote'),
});

export const updateQuoteStatusSchema = z.object({
  status: z.enum(QUOTE_STATUSES as unknown as [string, ...string[]]).refine(
    (v) => (QUOTE_STATUSES as readonly string[]).includes(v),
    { message: `status must be one of: ${QUOTE_STATUSES.join(', ')}` },
  ) as z.ZodType<(typeof QUOTE_STATUSES)[number]>,
  note: z.string().max(1000).nullable().optional(),
});

export const updateCustomerQuoteSchema = z.object({
  customerNotes: z.string().max(2000).nullable().optional(),
  items: z.array(quoteItemSchema).max(50, 'Maximum 50 items per quote').optional(),
  customerStatus: z.enum(CUSTOMER_QUOTE_STATUSES).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one customer quote field is required',
);

export type CreateQuoteBody = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteStatusBody = z.infer<typeof updateQuoteStatusSchema>;
export type UpdateCustomerQuoteBody = z.infer<typeof updateCustomerQuoteSchema>;
