import { z } from 'zod';

export const patchIsReadSchema = z.object({
  isRead: z.boolean(),
});

export const createContactSubmissionSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(255),
  email: z.string().trim().email('email must be a valid email address').max(255),
  phone: z.string().trim().max(50).nullable().optional(),
  subject: z.string().trim().max(255).nullable().optional(),
  message: z.string().trim().min(1, 'message is required').max(10_000),
});
