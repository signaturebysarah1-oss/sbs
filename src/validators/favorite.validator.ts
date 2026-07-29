import { z } from 'zod';

export const favoriteProductIdSchema = z.string().uuid('productId must be a valid UUID');
