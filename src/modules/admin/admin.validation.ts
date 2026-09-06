import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    role: z.enum(['CUSTOMER', 'OPERATOR', 'ADMIN']).optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['CUSTOMER', 'OPERATOR', 'ADMIN']),
  }),
});

export const getAuditLogsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    entity: z.string().optional(),
    action: z.string().optional(),
    userId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});
