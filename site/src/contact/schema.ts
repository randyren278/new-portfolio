import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(2000),
  hp: z.string().optional()
});

export type ContactInput = z.infer<typeof contactSchema>;
