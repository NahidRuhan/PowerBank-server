import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';

export class QuotaService {
  static async create(data: any, userId: string) {
    const existing = await prisma.sheddingQuota.findUnique({
      where: {
        date_timeSlot: {
          date: new Date(data.date),
          timeSlot: data.timeSlot,
        },
      },
    });

    if (existing) {
      throw new ConflictError('A quota for this date and time slot already exists');
    }

    const quota = await prisma.sheddingQuota.create({
      data: {
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        targetMW: data.targetMW,
        createdBy: userId,
      },
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'SheddingQuota',
      entityId: quota.id,
      changes: { new: quota },
    });

    return quota;
  }

  static async getAll(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    if (query.date) {
      where.date = new Date(query.date);
    }

    const [quotas, total] = await Promise.all([
      prisma.sheddingQuota.findMany({
        where,
        skip,
        take,
        orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
        include: {
            creator: { select: { name: true } },
            _count: { select: { schedules: true } }
        }
      }),
      prisma.sheddingQuota.count({ where }),
    ]);

    return {
      quotas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const quota = await prisma.sheddingQuota.findUnique({
      where: { id },
      include: {
        schedules: {
            include: { feeder: { select: { name: true, loadMW: true } } }
        }
      }
    });

    if (!quota) throw new NotFoundError('Quota not found');

    // Calculate total scheduled MW
    const totalScheduledMW = quota.schedules.reduce((sum, s) => {
        if (s.status !== 'CANCELLED') {
            return sum + s.feeder.loadMW;
        }
        return sum;
    }, 0);

    return {
        ...quota,
        totalScheduledMW,
        isOverTarget: totalScheduledMW > quota.targetMW * 1.1 // 10% tolerance
    };
  }
}
