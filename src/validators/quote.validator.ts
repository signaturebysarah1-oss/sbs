import { z } from 'zod';
import { QUOTE_STATUSES } from '../types/quote.types.js';

const quoteItemSchema = z.object({
  productId: z.string().uuid(),
  productNameSnapshot: z.string().min(1, 'productNameSnapshot is required'),
  variantLabelSnapshot: z.string().nullable().optional(),
  materialNameSnapshot: z.string().nullable().optional(),
  colorNameSnapshot: z.string().nullable().optional(),
  quantity: z.number().int().min(1, 'quantity must be at least 1'),
  unitPriceSnapshot: z.number().min(0, 'unitPriceSnapshot must be >= 0'),
  customMeasurements: z.record(z.string(), z.unknown()).nullable().optional(),
  customNotes: z.string().max(1000).nullable().optional(),
});

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

export type CreateQuoteBody = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteStatusBody = z.infer<typeof updateQuoteStatusSchema>;
