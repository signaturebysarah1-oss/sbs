import { z } from 'zod';

export const createAcademyRegistrationSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required').max(255),
  email: z.string().trim().email('email must be a valid email address').max(255),
  phone: z.string().trim().min(1, 'phone is required').max(50),
  country: z.string().trim().max(100).nullable().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional(),
  motivation: z.string().trim().max(10_000).nullable().optional(),
});
