import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  body: z.object({
    billId: z.string().min(1, 'Bill ID is required'),
  }),
});

export const getPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']).optional(),
  }),
});
