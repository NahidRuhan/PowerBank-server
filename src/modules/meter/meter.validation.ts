import { z } from 'zod';

export const createMeterSchema = z.object({
  body: z.object({
    number: z.string().min(3),
    areaId: z.string().cuid(),
  }),
});

export const deleteMeterSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});
