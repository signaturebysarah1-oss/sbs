import { z } from 'zod';

export const createGalleryImageSchema = z.object({
  title: z.string().trim().max(255).nullable().optional(),
  imageUrl: z.string().trim().min(1, 'imageUrl is required'),
  imagePublicId: z.string().trim().min(1, 'imagePublicId is required').max(255),
  category: z.enum(['workshop', 'craftsmanship', 'completed_work']),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});
