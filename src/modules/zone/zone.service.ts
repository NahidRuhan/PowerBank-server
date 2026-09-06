import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';

export class ZoneService {
  static async create(data: any, userId: string) {
    const existing = await prisma.distributionZone.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError('Zone with this code already exists');
    }

    const zone = await prisma.distributionZone.create({
      data,
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'DistributionZone',
      entityId: zone.id,
      changes: { new: zone },
    });

    return zone;
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

    const [zones, total] = await Promise.all([
      prisma.distributionZone.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { substations: true },
          },
        },
      }),
      prisma.distributionZone.count({ where }),
    ]);

    return {
      zones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const zone = await prisma.distributionZone.findUnique({
      where: { id },
      include: {
        _count: {
          select: { substations: true },
        },
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    return zone;
  }

  static async update(id: string, data: any, userId: string) {
    const zone = await prisma.distributionZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundError('Zone not found');

    if (data.code && data.code !== zone.code) {
      const existing = await prisma.distributionZone.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictError('Zone with this code already exists');
      }
    }

    const updated = await prisma.distributionZone.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'DistributionZone',
      entityId: id,
      changes: { old: zone, new: updated },
    });

    return updated;
  }

  static async delete(id: string, userId: string) {
    const zone = await prisma.distributionZone.findUnique({
      where: { id },
      include: { substations: true },
    });

    if (!zone) throw new NotFoundError('Zone not found');

    // Soft delete cascades down through manual Prisma updates
    // In a real production system, you might want to do this in a transaction
    // Here we'll soft-delete the zone, which is fine since our relations aren't strict cascading in code yet.
    // Wait, the requirement says "cascade soft-delete (zone + substations + feeders + areas)"
    await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Find all substations
      const substations = await tx.substation.findMany({
        where: { zoneId: id },
        select: { id: true },
      });
      const subIds = substations.map((s) => s.id);

      // Find all feeders
      const feeders = await tx.feeder.findMany({
        where: { substationId: { in: subIds } },
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
        where: { substationId: { in: subIds } },
        data: { deletedAt: now },
      });

      // Soft delete substations
      await tx.substation.updateMany({
        where: { zoneId: id },
        data: { deletedAt: now },
      });

      // Soft delete zone
      await tx.distributionZone.update({
        where: { id },
        data: { deletedAt: now },
      });
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'DistributionZone',
      entityId: id,
    });
  }
}
