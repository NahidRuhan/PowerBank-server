import { prisma } from '../../lib/prisma.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';
import { NotificationService } from '../../lib/notification.service.js';

export class IncidentService {
  static async create(data: any, userId: string) {
    let targetFeederId = data.feederId;

    if (!targetFeederId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { area: true },
      });
      if (!user || !user.areaId) {
        throw new ValidationError('You must provide a feederId or have an assigned area to report an incident');
      }
      targetFeederId = user.area!.feederId;
    }

    const feeder = await prisma.feeder.findUnique({
      where: { id: targetFeederId },
      include: { areas: true },
    });

    if (!feeder) throw new NotFoundError('Feeder not found');

    let incident = await prisma.outageIncident.findFirst({
      where: { feederId: targetFeederId, status: { not: 'RESOLVED' }, deletedAt: null }
    });

    if (!incident) {
      // Determine priority from highest-priority Area
      let priority: any = 'MEDIUM';
      const priorities = feeder.areas.map((a) => a.priority);
      if (priorities.includes('CRITICAL')) priority = 'CRITICAL';
      else if (priorities.includes('HIGH')) priority = 'HIGH';
      else if (priorities.includes('MEDIUM')) priority = 'MEDIUM';
      else if (priorities.includes('LOW')) priority = 'LOW';

      // 1. Create incident and update feeder status to FAULT
      incident = await prisma.$transaction(async (tx) => {
        const inc = await tx.outageIncident.create({
          data: {
            feederId: targetFeederId,
            description: data.description,
            photoUrl: data.photoUrl,
            priority,
            estimatedRestoration: data.estimatedRestoration
              ? new Date(data.estimatedRestoration)
              : null,
            createdBy: userId,
          },
        });

        // Sync Feeder status
        await tx.feeder.update({
          where: { id: targetFeederId },
          data: { status: 'FAULT' },
        });

        return inc;
      });

      await createAuditLog({
        userId,
        action: 'CREATE',
        entity: 'OutageIncident',
        entityId: incident.id,
        changes: { incident: { from: null, to: incident } },
      });

      NotificationService.notifyAffectedCustomers(
        targetFeederId,
        'Unexpected Power Outage',
        `An unexpected power outage has been reported in your area. Description: ${data.description}. Our team is investigating.`,
      );
    }

    // Always link report to incident
    await prisma.outageReport.create({
      data: {
        incidentId: incident.id,
        userId,
        description: data.description,
        photoUrl: data.photoUrl,
      }
    });

    return incident;
  }

  static async getAll(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = { deletedAt: null };

    if (query.feederId) where.feederId = query.feederId;
    if (query.status) where.status = query.status;

    const [incidents, total] = await Promise.all([
      prisma.outageIncident.findMany({
        where,
        skip,
        take,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          feeder: { select: { name: true, code: true } },
          creator: { select: { name: true } },
          reports: true,
        },
      }),
      prisma.outageIncident.count({ where }),
    ]);

    return {
      incidents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const incident = await prisma.outageIncident.findUnique({
      where: { id, deletedAt: null },
      include: {
        feeder: { select: { name: true, code: true } },
        creator: { select: { name: true } },
        reports: { include: { user: { select: { name: true } } } },
      },
    });

    if (!incident) throw new NotFoundError('Incident not found');
    return incident;
  }

  static async update(id: string, data: any, userId: string) {
    const incident = await prisma.outageIncident.findUnique({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundError('Incident not found');

    if (incident.status === 'RESOLVED') {
      throw new ValidationError('Cannot update a resolved incident');
    }

    if (data.status) {
      const order = { 'REPORTED': 0, 'ACKNOWLEDGED': 1, 'IN_PROGRESS': 2, 'RESOLVED': 3 };
      const currentIdx = order[incident.status as keyof typeof order];
      const targetIdx = order[data.status as keyof typeof order];
      
      if (data.status !== 'CANCELLED' && targetIdx !== undefined && currentIdx !== undefined) {
         if (targetIdx !== currentIdx && targetIdx !== currentIdx + 1) {
             throw new ValidationError(`Invalid state transition from ${incident.status} to ${data.status}. State transitions must be strictly sequential.`);
         }
      }
    }

    const updateData: any = { ...data };
    if (data.estimatedRestoration) {
      updateData.estimatedRestoration = new Date(data.estimatedRestoration);
    }
    
    if (data.assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId } });
      if (!assignee || assignee.role !== 'OPERATOR') {
        throw new ValidationError('Assignee must be an OPERATOR');
      }
      updateData.assignedToId = data.assignedToId;
    }

    let syncFeeder = false;
    if (data.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      syncFeeder = true;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.outageIncident.update({
        where: { id },
        data: updateData,
      });

      if (syncFeeder) {
        // Only set back to ENERGIZED if there are no other active incidents or schedules for this feeder
        const activeEvents = await tx.feeder.findUnique({
          where: { id: incident.feederId },
          include: {
            incidents: { where: { status: { not: 'RESOLVED' }, deletedAt: null } },
            schedules: { where: { status: 'ACTIVE', deletedAt: null } },
          },
        });

        if (
          activeEvents &&
          activeEvents.incidents.length === 0 &&
          activeEvents.schedules.length === 0
        ) {
          await tx.feeder.update({
            where: { id: incident.feederId },
            data: { status: 'ENERGIZED' },
          });
        }
      }
      return upd;
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'OutageIncident',
      entityId: id,
      changes: { incident: { from: incident, to: updated } },
    });

    if (data.status === 'RESOLVED') {
      NotificationService.notifyAffectedCustomers(
        incident.feederId,
        'Power Restored',
        'The unexpected power outage in your area has been resolved. Power should now be restored.',
      );
    } else if (
      data.estimatedRestoration &&
      updated.estimatedRestoration?.getTime() !== incident.estimatedRestoration?.getTime()
    ) {
      NotificationService.notifyAffectedCustomers(
        incident.feederId,
        'Outage Update: Estimated Restoration Time',
        `The estimated restoration time for the current outage in your area has been updated to: ${updated.estimatedRestoration?.toLocaleString()}`,
      );
    } else if (data.assignedToId && updated.assignedToId !== incident.assignedToId) {
       NotificationService.notifyAffectedCustomers(
        incident.feederId,
        'Outage Update: Technician Assigned',
        'A technician has been assigned to resolve the power outage in your area.',
      );
    }

    return updated;
  }
}
