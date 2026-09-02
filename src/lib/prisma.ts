import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Prisma middleware for soft deletes
prisma.$use(async (params, next) => {
  if (
    params.model === 'User' ||
    params.model === 'Zone' ||
    params.model === 'Substation' ||
    params.model === 'Feeder' ||
    params.model === 'Area' ||
    params.model === 'ScheduledOutage' ||
    params.model === 'Incident' ||
    params.model === 'OutageReport'
  ) {
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.action = 'findFirst';
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    if (params.action === 'findMany') {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      } else {
        params.args.where = { deletedAt: null };
      }
    }
    if (params.action === 'update') {
      params.action = 'updateMany';
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data !== undefined) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
    }
  }
  return next(params);
});
