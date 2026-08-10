import { z } from 'zod';
import { CUSTOMER_QUOTE_STATUSES } from '../types/quote.types.js';

// ─── Item schema ──────────────────────────────────────────────────────────────

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

// ─── Admin status update schema — flexible string, not a fixed enum ───────────

export const updateQuoteStatusSchema = z.object({
  status: z.string().trim().min(1, 'status is required').max(50),
  note: z.string().max(1000).nullable().optional(),
});

// ─── Admin payment/receipt schema ─────────────────────────────────────────────

export const updateQuotePaymentSchema = z.object({
  paymentUrl: z.string().url('paymentUrl must be a valid URL').nullable().optional(),
  receiptUrl: z.string().url('receiptUrl must be a valid URL').nullable().optional(),
  receiptPublicId: z.string().trim().max(255).nullable().optional(),
}).refine(
  (d) => d.paymentUrl !== undefined || d.receiptUrl !== undefined || d.receiptPublicId !== undefined,
  'At least one payment field must be provided',
);

export const submitQuoteReceiptSchema = z.object({
  receiptUrl: z.string().url('receiptUrl must be a valid URL').nullable().optional(),
  receiptPublicId: z.string().trim().max(255).nullable().optional(),
}).refine(
  (d) => d.receiptUrl !== undefined || d.receiptPublicId !== undefined,
  'receiptUrl or receiptPublicId must be provided',
);

export const updateQuoteFulfillmentSchema = z.object({
  shippingTrackingNumber: z.string().trim().max(255).nullable().optional(),
  shippingTrackingUrl: z.string().url('shippingTrackingUrl must be a valid URL').nullable().optional(),
  shippingDetails: z.record(z.string(), z.unknown()).nullable().optional(),
}).refine((d) => Object.values(d).some((value) => value !== undefined), 'At least one fulfillment field must be provided');

export type CreateQuoteBody = z.infer<typeof createQuoteSchema>;
export type UpdateCustomerQuoteBody = z.infer<typeof updateCustomerQuoteSchema>;
export type UpdateQuoteStatusBody = z.infer<typeof updateQuoteStatusSchema>;
