import { z } from 'zod';

export const createAreaSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    feederId: z.string().cuid(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    customerCount: z.number().int().nonnegative().optional(),
  }),
});

export const updateAreaSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).optional(),
    feederId: z.string().cuid().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    customerCount: z.number().int().nonnegative().optional(),
  }),
});

export const getAreasQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    feederId: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  }),
});

export const searchAreasQuerySchema = z.object({
    query: z.object({
        q: z.string().min(2)
    })
})
