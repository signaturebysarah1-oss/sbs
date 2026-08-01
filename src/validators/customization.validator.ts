import { z } from 'zod';

const status = z.enum(['active', 'inactive']);
const categoryFields = {
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(255),
  status: status.optional(),
  sortOrder: z.number().int().min(0).optional(),
};
const optionFields = {
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(255),
  imageUrl: z.string().trim().min(1).nullable().optional(),
  imagePublicId: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().max(10_000).nullable().optional(),
  status: status.optional(),
  sortOrder: z.number().int().min(0).optional(),
};

export const createCustomizationCategorySchema = z.object(categoryFields);
export const updateCustomizationCategorySchema = z.object(categoryFields).partial().refine((data) => Object.keys(data).length > 0, 'At least one category field is required');
export const createCustomizationOptionSchema = z.object(optionFields);
export const updateCustomizationOptionSchema = z.object(optionFields).partial().refine((data) => Object.keys(data).length > 0, 'At least one option field is required');
