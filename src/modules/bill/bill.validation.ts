import { z } from 'zod';

export const generateBillsSchema = z.object({
  body: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
    baseAmount: z.number().positive('Base amount must be positive'),
    dueDate: z.string().datetime({ message: 'Due date must be a valid ISO datetime' }),
  }),
});

export const getBillsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['UNPAID', 'PAID', 'OVERDUE']).optional(),
    month: z.string().optional(),
  }),
});
