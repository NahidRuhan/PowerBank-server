import { z } from 'zod';

export const createSubstationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    capacityMW: z.number().positive(),
    zoneId: z.string().cuid(),
  }),
});

export const updateSubstationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).optional(),
    capacityMW: z.number().positive().optional(),
    zoneId: z.string().cuid().optional(),
  }),
});

export const getSubstationsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    zoneId: z.string().optional(),
  }),
});
