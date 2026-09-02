import { z } from 'zod';

export const createFeederSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    loadMW: z.number().positive(),
    substationId: z.string().cuid(),
  }),
});

export const updateFeederSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).optional(),
    loadMW: z.number().positive().optional(),
    substationId: z.string().cuid().optional(),
  }),
});

export const updateFeederStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ENERGIZED', 'MAINTENANCE']), // Manual updates can only be these
  }),
});

export const getFeedersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    substationId: z.string().optional(),
    status: z.enum(['ENERGIZED', 'LOAD_SHED', 'FAULT', 'MAINTENANCE']).optional(),
  }),
});
