import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';

export class SubstationService {
  static async create(data: any, userId: string) {
    const existing = await prisma.substation.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError('Substation with this code already exists');
    }

    const zoneExists = await prisma.distributionZone.findUnique({
      where: { id: data.zoneId },
    });
    if (!zoneExists) {
      throw new NotFoundError('Zone not found');
    }

    const substation = await prisma.substation.create({
      data,
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Substation',
      entityId: substation.id,
      changes: { new: substation },
    });

    return substation;
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

    if (query.zoneId) {
      where.zoneId = query.zoneId;
    }

    const [substations, total] = await Promise.all([
      prisma.substation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          zone: { select: { id: true, name: true, code: true } },
          _count: {
            select: { feeders: true },
          },
        },
      }),
      prisma.substation.count({ where }),
    ]);

    return {
      substations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const substation = await prisma.substation.findUnique({
      where: { id },
      include: {
        zone: { select: { id: true, name: true, code: true } },
        _count: {
          select: { feeders: true },
        },
      },
    });

    if (!substation) {
      throw new NotFoundError('Substation not found');
    }

    return substation;
  }

  static async update(id: string, data: any, userId: string) {
    const substation = await prisma.substation.findUnique({ where: { id } });
    if (!substation) throw new NotFoundError('Substation not found');

    if (data.code && data.code !== substation.code) {
      const existing = await prisma.substation.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictError('Substation with this code already exists');
      }
    }

    if (data.zoneId && data.zoneId !== substation.zoneId) {
      const zoneExists = await prisma.distributionZone.findUnique({
        where: { id: data.zoneId },
      });
      if (!zoneExists) {
        throw new NotFoundError('Zone not found');
      }
    }

    const updated = await prisma.substation.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Substation',
      entityId: id,
      changes: { old: substation, new: updated },
    });

    return updated;
  }

  static async delete(id: string, userId: string) {
    const substation = await prisma.substation.findUnique({
      where: { id },
    });

    if (!substation) throw new NotFoundError('Substation not found');

    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Find all feeders
      const feeders = await tx.feeder.findMany({
        where: { substationId: id },
        select: { id: true },
      });
      const feederIds = feeders.map((f) => f.id);

      // Soft delete areas
      await tx.area.updateMany({
        where: { feederId: { in: feederIds } },
        data: { deletedAt: now },
      });

      // Soft delete feeders
      await tx.feeder.updateMany({
        where: { substationId: id },
        data: { deletedAt: now },
      });

      // Soft delete substation
      await tx.substation.update({
        where: { id },
        data: { deletedAt: now },
      });
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'Substation',
      entityId: id,
    });
  }
}
