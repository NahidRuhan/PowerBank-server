import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    avatar: z.string().url().optional(),
    meterNumber: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(6),
  }),
});
