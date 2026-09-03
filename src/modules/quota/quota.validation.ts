import { z } from 'zod';

export const createQuotaSchema = z.object({
  body: z.object({
    date: z.string().datetime(), // ISO string e.g. "2026-09-05T00:00:00.000Z"
    timeSlot: z.string().min(5), // e.g. "17:00-21:00"
    targetMW: z.number().positive(),
  }),
});

export const getQuotasQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    date: z.string().datetime().optional(),
  }),
});
