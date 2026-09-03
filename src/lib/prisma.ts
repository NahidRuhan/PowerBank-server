import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter });

const softDeleteModels = [
  'User',
  'DistributionZone', // Updated from 'Zone' to match schema
  'Substation',
  'Feeder',
  'Area',
  'ScheduledOutage',
];

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findUnique({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          return (basePrisma as any)[model].findFirst({
            ...args,
            where: { ...args.where, deletedAt: null },
          });
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async findMany({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async update({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async updateMany({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async delete({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          return (basePrisma as any)[model].update({
            ...args,
            data: { ...args.data, deletedAt: new Date() },
          });
        }
        return query(args);
      },
      async deleteMany({ model, args, query }) {
        if (softDeleteModels.includes(model)) {
          return (basePrisma as any)[model].updateMany({
            ...args,
            data: { ...args.data, deletedAt: new Date() },
          });
        }
        return query(args);
      },
    },
  },
});
