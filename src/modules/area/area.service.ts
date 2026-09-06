import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';

export class AreaService {
  static async create(data: any, userId: string) {
    const existing = await prisma.area.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError('Area with this code already exists');
    }

    const feederExists = await prisma.feeder.findUnique({
      where: { id: data.feederId },
    });
    if (!feederExists) {
      throw new NotFoundError('Feeder not found');
    }

    const area = await prisma.area.create({
      data,
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Area',
      entityId: area.id,
      changes: { new: area },
    });

    return area;
  }

  static async getAll(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.feederId) {
      where.feederId = query.feederId;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const [areas, total] = await Promise.all([
      prisma.area.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          feeder: { select: { id: true, name: true, code: true, status: true } },
        },
      }),
      prisma.area.count({ where }),
    ]);

    return {
      areas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async search(query: string) {
    const areas = await prisma.area.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
      include: {
        feeder: { select: { id: true, name: true, code: true, status: true } },
      },
    });
    return areas;
  }

  static async getById(id: string) {
    const area = await prisma.area.findUnique({
      where: { id },
      include: {
        feeder: { select: { id: true, name: true, code: true, status: true } },
      },
    });

    if (!area) {
      throw new NotFoundError('Area not found');
    }

    return area;
  }

  static async update(id: string, data: any, userId: string) {
    const area = await prisma.area.findUnique({ where: { id } });
    if (!area) throw new NotFoundError('Area not found');

    if (data.code && data.code !== area.code) {
      const existing = await prisma.area.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictError('Area with this code already exists');
      }
    }

    if (data.feederId && data.feederId !== area.feederId) {
      const feederExists = await prisma.feeder.findUnique({
        where: { id: data.feederId },
      });
      if (!feederExists) {
        throw new NotFoundError('Feeder not found');
      }
    }

    const updated = await prisma.area.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Area',
      entityId: id,
      changes: { old: area, new: updated },
    });

    return updated;
  }

  static async delete(id: string, userId: string) {
    const area = await prisma.area.findUnique({
      where: { id },
    });

    if (!area) throw new NotFoundError('Area not found');

    await prisma.area.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'Area',
      entityId: id,
    });
  }
}
