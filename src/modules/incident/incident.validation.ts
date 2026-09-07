import { z } from 'zod';

export const createIncidentSchema = z.object({
  body: z.object({
    feederId: z.string().cuid(),
    description: z.string().min(10),
    estimatedRestoration: z.string().datetime().optional(), // Can be set later
  }),
});

export const updateIncidentSchema = z.object({
  body: z.object({
    description: z.string().min(10).optional(),
    status: z.enum(['REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED']).optional(),
    estimatedRestoration: z.string().datetime().optional(),
    assignedToId: z.string().cuid().optional(),
  }),
});

export const getIncidentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    feederId: z.string().optional(),
    status: z.enum(['REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED']).optional(),
  }),
});
