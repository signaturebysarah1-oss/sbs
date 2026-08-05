import { z } from 'zod';
import { CUSTOMER_QUOTE_STATUSES, QUOTE_STATUSES } from '../types/quote.types.js';

// ─── Item schema ──────────────────────────────────────────────────────────────
// All snapshot fields are optional — a draft item may be partially filled.
// productId is nullable: a fully custom shoe may have no product record.

const quoteItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
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
  unitPriceSnapshot: z.number().min(0).nullable().optional(),
  customMeasurements: z.record(z.string(), z.unknown()).nullable().optional(),
  customNotes: z.string().max(1000).nullable().optional(),
}).transform((item) => ({
  productId: item.productId ?? null,
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

// ─── Create / upsert draft schema ─────────────────────────────────────────────
// Used for POST /api/quotes.
// Items are optional — a customer can create an empty draft first.

export const createQuoteSchema = z.object({
  guestName: z.string().trim().min(1).max(255).optional(),
  guestEmail: z.string().trim().email().max(255).optional(),
  guestPhone: z.string().trim().min(1).max(50).optional(),
  customerNotes: z.string().max(2000).nullable().optional(),
  items: z.array(quoteItemSchema).max(50, 'Maximum 50 items per quote').optional(),
  contactMethod: z.enum(['email', 'whatsapp']).optional(),
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'phoneNumber must be at least 7 characters')
    .max(20, 'phoneNumber must be at most 20 characters')
    .nullable()
    .optional(),
});

// ─── Update customer quote schema ─────────────────────────────────────────────
// Used for PATCH /api/quotes/:id.
// When customerStatus = 'completed', each item must have at least a quantity.
// Snapshot fields remain optional even at completion — the customer may not
// know the exact product name or price; the admin resolves those.

export const updateCustomerQuoteSchema = z.object({
  customerNotes: z.string().max(2000).nullable().optional(),
  items: z.array(quoteItemSchema).max(50, 'Maximum 50 items per quote').optional(),
  customerStatus: z.enum(CUSTOMER_QUOTE_STATUSES).optional(),
}).refine(
  (data) => {
    const keys = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
    return keys.length > 0;
  },
  'At least one field must be provided',
);

// ─── Admin status update schema ───────────────────────────────────────────────

export const updateQuoteStatusSchema = z.object({
  status: z.enum(QUOTE_STATUSES as unknown as [string, ...string[]]).refine(
    (v) => (QUOTE_STATUSES as readonly string[]).includes(v),
    { message: `status must be one of: ${QUOTE_STATUSES.join(', ')}` },
  ) as z.ZodType<(typeof QUOTE_STATUSES)[number]>,
  note: z.string().max(1000).nullable().optional(),
});

export type CreateQuoteBody = z.infer<typeof createQuoteSchema>;
export type UpdateCustomerQuoteBody = z.infer<typeof updateCustomerQuoteSchema>;
export type UpdateQuoteStatusBody = z.infer<typeof updateQuoteStatusSchema>;
