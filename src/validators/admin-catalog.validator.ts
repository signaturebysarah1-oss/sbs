import { z } from 'zod';

const catalogStatusSchema = z.enum(['draft', 'published', 'archived']);

// All product fields are optional at the schema level to support incomplete drafts.
// The service enforces that published products have name, slug, and basePrice.
const productFields = {
  name: z.string().trim().min(1, 'name must not be empty').max(255).nullable().optional(),
  slug: z.string().trim().min(1, 'slug must not be empty').max(255).nullable().optional(),
  description: z.string().trim().max(10_000).nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
  gender: z.enum(['male', 'female', 'unisex']).nullable().optional(),
  basePrice: z.number().min(0, 'basePrice must be >= 0').nullable().optional(),
  isCustomizable: z.boolean().optional(),
  status: catalogStatusSchema.optional(),
  isFeatured: z.boolean().optional(),
  isHero: z.boolean().optional(),
  colors: z.array(z.object({
    name: z.string().trim().min(1, 'color name is required').max(255),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'color hex must be a #RRGGBB value'),
  })).max(100).optional(),
  materials: z.array(z.object({
    name: z.string().trim().min(1, 'material name is required').max(255),
  })).max(100).optional(),
  sizes: z.array(z.number().min(0).max(999.99)).max(100).optional(),
};

type ProductFieldsInput = z.infer<z.ZodObject<typeof productFields>>;

function validateProductDuplicates(data: ProductFieldsInput, ctx: z.RefinementCtx): void {
  if (data.colors && new Set(data.colors.map((c) => c.name.toLowerCase())).size !== data.colors.length) {
    ctx.addIssue({ code: 'custom', message: 'colors must not contain duplicate names', path: ['colors'] });
  }
  if (data.materials && new Set(data.materials.map((m) => m.name.toLowerCase())).size !== data.materials.length) {
    ctx.addIssue({ code: 'custom', message: 'materials must not contain duplicate names', path: ['materials'] });
  }
  if (data.sizes && new Set(data.sizes).size !== data.sizes.length) {
    ctx.addIssue({ code: 'custom', message: 'sizes must not contain duplicate values', path: ['sizes'] });
  }
}

export const createProductSchema = z.object(productFields).superRefine(validateProductDuplicates);

export const updateProductSchema = z.object(productFields).superRefine(validateProductDuplicates).refine(
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
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0).optional(),
};

export const createCollectionSchema = z.object(collectionFields);
export const updateCollectionSchema = z.object(collectionFields).partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one collection field is required',
);
