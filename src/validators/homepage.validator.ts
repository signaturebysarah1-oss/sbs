import { z } from 'zod';

const carouselFields = {
  imageUrl: z.string().trim().min(1, 'imageUrl is required'),
  imagePublicId: z.string().trim().min(1, 'imagePublicId is required').max(255),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
};

export const createCarouselItemSchema = z.object(carouselFields);
export const updateCarouselItemSchema = z.object(carouselFields).partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one carousel field is required',
);
