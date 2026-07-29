import { z } from 'zod';

const catalogStatusSchema = z.enum(['draft', 'published', 'archived']);

const productFields = {
  name: z.string().trim().min(1, 'name is required').max(255),
  slug: z.string().trim().min(1, 'slug is required').max(255),
  description: z.string().trim().max(10_000).nullable(),
  basePrice: z.number().min(0, 'basePrice must be >= 0'),
  isCustomizable: z.boolean(),
  status: catalogStatusSchema,
  isFeatured: z.boolean(),
  isHero: z.boolean(),
};

export const createProductSchema = z.object(productFields);
export const updateProductSchema = z.object(productFields).partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one product field is required',
);

export const createProductImageSchema = z.object({
  imageUrl: z.string().trim().min(1, 'imageUrl is required'),
  imagePublicId: z.string().trim().min(1, 'imagePublicId is required').max(255),
  altText: z.string().trim().max(255).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
});

export const productCollectionAssignmentSchema = z.object({
  collectionId: z.string().uuid('collectionId must be a valid UUID'),
});

const productVariantFields = {
  sizeLabel: z.string().trim().max(50).nullable().optional(),
  sizeValue: z.number().min(0).max(999.99).nullable().optional(),
  sku: z.string().trim().max(100).nullable().optional(),
  priceAdjustment: z.number().min(-99_999_999.99).max(99_999_999.99).optional(),
  colorId: z.string().uuid('colorId must be a valid UUID').nullable().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
};

export const createProductVariantSchema = z.object(productVariantFields);
export const updateProductVariantSchema = z.object(productVariantFields).refine(
  (data) => Object.keys(data).length > 0,
  'At least one variant field is required',
);

const collectionFields = {
  name: z.string().trim().min(1, 'name is required').max(255),
  slug: z.string().trim().min(1, 'slug is required').max(255),
  description: z.string().trim().max(10_000).nullable().optional(),
  imageUrl: z.string().trim().min(1).nullable().optional(),
  imagePublicId: z.string().trim().max(255).nullable().optional(),
  status: catalogStatusSchema,
  sortOrder: z.number().int().min(0).optional(),
};

export const createCollectionSchema = z.object(collectionFields);
export const updateCollectionSchema = z.object(collectionFields).partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one collection field is required',
);
