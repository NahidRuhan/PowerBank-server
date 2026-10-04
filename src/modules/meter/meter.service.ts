import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { parsePagination } from '../../lib/pagination.js';

export class MeterService {
  static async createMeter(data: { number: string; areaId: string }) {
    const existingMeter = await prisma.meter.findUnique({
      where: { number: data.number },
    });

    if (existingMeter) {
      throw new ConflictError('Meter number already exists');
    }

    const area = await prisma.area.findUnique({
      where: { id: data.areaId },
    });

    if (!area) {
      throw new NotFoundError('Area not found');
    }

    return await prisma.meter.create({
      data: {
        number: data.number,
        areaId: data.areaId,
      },
    });
  }

  static async getAllMeters(query: any = {}) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    if (query.areaId) {
      where.areaId = query.areaId;
    }

    if (query.search) {
      where.number = { contains: query.search, mode: 'insensitive' };
    }

    const [meters, total] = await Promise.all([
      prisma.meter.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          area: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.meter.count({ where }),
    ]);

    return {
      meters,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async deleteMeter(id: string) {
    const meter = await prisma.meter.findUnique({
      where: { id },
    });

    if (!meter) {
      throw new NotFoundError('Meter not found');
    }

    // Unlink the user if exists
    if (meter.userId) {
      await prisma.user.update({
        where: { id: meter.userId },
        data: { areaId: null }, // User loses area connection if meter is removed
      });
    }

    return await prisma.meter.delete({
      where: { id },
    });
  }
}
