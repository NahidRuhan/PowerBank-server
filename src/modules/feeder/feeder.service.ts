import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';

export class FeederService {
  static async create(data: any, userId: string) {
    const existing = await prisma.feeder.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictError('Feeder with this code already exists');
    }

    const substationExists = await prisma.substation.findUnique({
      where: { id: data.substationId }
    });
    if (!substationExists) {
        throw new NotFoundError('Substation not found');
    }

    const feeder = await prisma.feeder.create({
      data,
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Feeder',
      entityId: feeder.id,
      changes: { new: feeder },
    });

    return feeder;
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
    
    if (query.substationId) {
        where.substationId = query.substationId;
    }

    if (query.status) {
        where.status = query.status;
    }

    const [feeders, total] = await Promise.all([
      prisma.feeder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          substation: { select: { id: true, name: true, code: true } },
          _count: {
            select: { areas: true },
          },
        },
      }),
      prisma.feeder.count({ where }),
    ]);

    return {
      feeders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const feeder = await prisma.feeder.findUnique({
      where: { id },
      include: {
        substation: { select: { id: true, name: true, code: true } },
        _count: {
          select: { areas: true },
        },
      },
    });

    if (!feeder) {
      throw new NotFoundError('Feeder not found');
    }

    return feeder;
  }

  static async update(id: string, data: any, userId: string) {
    const feeder = await prisma.feeder.findUnique({ where: { id } });
    if (!feeder) throw new NotFoundError('Feeder not found');

    if (data.code && data.code !== feeder.code) {
      const existing = await prisma.feeder.findUnique({
        where: { code: data.code },
      });
      if (existing) {
        throw new ConflictError('Feeder with this code already exists');
      }
    }

    if (data.substationId && data.substationId !== feeder.substationId) {
        const subExists = await prisma.substation.findUnique({
            where: { id: data.substationId }
        });
        if (!subExists) {
            throw new NotFoundError('Substation not found');
        }
    }

    const updated = await prisma.feeder.update({
      where: { id },
      data,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Feeder',
      entityId: id,
      changes: { old: feeder, new: updated },
    });

    return updated;
  }

  static async updateStatus(id: string, status: any, userId: string) {
    const feeder = await prisma.feeder.findUnique({ where: { id } });
    if (!feeder) throw new NotFoundError('Feeder not found');

    const updated = await prisma.feeder.update({
        where: { id },
        data: { status }
    });

    await createAuditLog({
        userId,
        action: 'UPDATE_STATUS',
        entity: 'Feeder',
        entityId: id,
        changes: { old: { status: feeder.status }, new: { status } }
    });

    return updated;
  }

  static async delete(id: string, userId: string) {
    const feeder = await prisma.feeder.findUnique({
      where: { id },
    });

    if (!feeder) throw new NotFoundError('Feeder not found');

    await prisma.$transaction(async (tx) => {
        const now = new Date();
        
        // Soft delete areas
        await tx.area.updateMany({
            where: { feederId: id },
            data: { deletedAt: now }
        });

        // Soft delete feeder
        await tx.feeder.update({
            where: { id },
            data: { deletedAt: now }
        });
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'Feeder',
      entityId: id,
    });
  }
}
