import { z } from 'zod';

export const createScheduleSchema = z.object({
  body: z.object({
    feederId: z.string().cuid(),
    quotaId: z.string().cuid().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    reason: z.string().min(5),
  }).refine(data => new Date(data.endTime) > new Date(data.startTime), {
      message: "endTime must be after startTime",
      path: ["endTime"]
  })
});

export const updateScheduleSchema = z.object({
  body: z.object({
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    reason: z.string().min(5).optional(),
    quotaId: z.string().cuid().optional(),
  })
});

export const updateScheduleStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']),
  }),
});

export const getSchedulesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    feederId: z.string().optional(),
    areaId: z.string().optional(),
    status: z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    date: z.string().optional(), // YYYY-MM-DD
  }),
});
