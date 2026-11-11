import { z } from 'zod';

/**
 * POST /api/v1/admin/faculty body (admin only).
 * Mirrors the client AdminPage zod schema – keep both in sync.
 */
export const createFacultySchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(40, 'Username must be at most 40 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username may only contain letters, numbers, dots, underscores and hyphens'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().trim().max(100, 'Name must be at most 100 characters').optional(),
});
