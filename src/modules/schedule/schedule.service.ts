import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';
import { NotificationService } from '../../lib/notification.service.js';

export class ScheduleService {
  static async create(data: any, userId: string) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start < new Date()) {
        throw new ValidationError('Start time cannot be in the past');
    }

    const feeder = await prisma.feeder.findUnique({
        where: { id: data.feederId },
        include: { areas: true }
    });

    if (!feeder) throw new NotFoundError('Feeder not found');

    // 1. Priority Check: Cannot schedule if it has a CRITICAL area
    const hasCritical = feeder.areas.some(a => a.priority === 'CRITICAL');
    if (hasCritical) {
        throw new ConflictError('Cannot schedule load shedding on a feeder with CRITICAL priority areas');
    }

    // 2. Conflict Check: Overlapping schedules on this feeder
    const conflict = await prisma.scheduledOutage.findFirst({
        where: {
            feederId: data.feederId,
            status: { in: ['SCHEDULED', 'ACTIVE'] },
            OR: [
                { startTime: { lt: end }, endTime: { gt: start } }
            ]
        }
    });

    if (conflict) {
        throw new ConflictError('This feeder already has an overlapping schedule');
    }

    // 3. Create schedule
    const schedule = await prisma.scheduledOutage.create({
        data: {
            feederId: data.feederId,
            quotaId: data.quotaId,
            startTime: start,
            endTime: end,
            reason: data.reason,
            createdBy: userId
        }
    });

    // 4. Quota validation warning check
    let warning = null;
    if (data.quotaId) {
        const quota = await prisma.sheddingQuota.findUnique({ 
            where: { id: data.quotaId },
            include: { schedules: { include: { feeder: true } } }
        });
        if (quota) {
            const totalScheduledMW = quota.schedules.reduce((sum, s) => {
                if (s.status !== 'CANCELLED') {
                    return sum + s.feeder.loadMW;
                }
                return sum;
            }, 0);
            if (totalScheduledMW > quota.targetMW * 1.1) {
                warning = `Quota target exceeded. Total scheduled: ${totalScheduledMW} MW, Target: ${quota.targetMW} MW`;
            }
        }
    }

    await createAuditLog({
        userId,
        action: 'CREATE',
        entity: 'ScheduledOutage',
        entityId: schedule.id,
        changes: { new: schedule }
    });

    // Notify customers about upcoming schedule
    NotificationService.notifyAffectedCustomers(
      data.feederId,
      'Upcoming Load Shedding Schedule',
      `A load shedding schedule has been planned for your area from ${start.toLocaleString()} to ${end.toLocaleString()}. Reason: ${data.reason}`
    );

    return { schedule, warning };
  }

  static async getAll(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};

    if (query.feederId) where.feederId = query.feederId;
    if (query.status) where.status = query.status;

    // Customer passing areaId to see their schedules
    if (query.areaId) {
        const area = await prisma.area.findUnique({ where: { id: query.areaId } });
        if (area) {
            where.feederId = area.feederId;
        }
    }

    if (query.date) {
        const startOfDay = new Date(query.date);
        startOfDay.setUTCHours(0,0,0,0);
        const endOfDay = new Date(query.date);
        endOfDay.setUTCHours(23,59,59,999);
        
        where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    const [schedules, total] = await Promise.all([
      prisma.scheduledOutage.findMany({
        where,
        skip,
        take,
        orderBy: { startTime: 'asc' },
        include: {
            feeder: { select: { name: true, code: true, loadMW: true } }
        }
      }),
      prisma.scheduledOutage.count({ where }),
    ]);

    return {
      schedules,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const schedule = await prisma.scheduledOutage.findUnique({
      where: { id },
      include: {
          feeder: { select: { name: true, code: true, loadMW: true } },
          creator: { select: { name: true } },
          quota: true
      }
    });

    if (!schedule) throw new NotFoundError('Schedule not found');
    return schedule;
  }

  static async updateStatus(id: string, status: any, userId: string) {
      const schedule = await prisma.scheduledOutage.findUnique({ where: { id } });
      if (!schedule) throw new NotFoundError('Schedule not found');

      // State machine rules
      if (schedule.status === 'CANCELLED' || schedule.status === 'COMPLETED') {
          throw new ValidationError(`Cannot change status of a ${schedule.status} schedule`);
      }
      
      if (status === 'COMPLETED' && schedule.status !== 'ACTIVE') {
          throw new ValidationError('Can only complete an ACTIVE schedule');
      }
      if (status === 'ACTIVE' && schedule.status !== 'SCHEDULED') {
          throw new ValidationError('Can only activate a SCHEDULED schedule');
      }

      await prisma.$transaction(async (tx) => {
          // Update Schedule
          await tx.scheduledOutage.update({
              where: { id },
              data: { status }
          });

          // Sync Feeder status
          if (status === 'ACTIVE') {
              await tx.feeder.update({ where: { id: schedule.feederId }, data: { status: 'LOAD_SHED' }});
          } else if (status === 'COMPLETED') {
              // Only revert to ENERGIZED if no other active schedules/incidents exist (simplified for now)
              await tx.feeder.update({ where: { id: schedule.feederId }, data: { status: 'ENERGIZED' }});
          }
      });

      await createAuditLog({
          userId,
          action: 'UPDATE_STATUS',
          entity: 'ScheduledOutage',
          entityId: id,
          changes: { old: { status: schedule.status }, new: { status } }
      });

      if (status === 'ACTIVE') {
          NotificationService.notifyAffectedCustomers(
              schedule.feederId,
              'Load Shedding Schedule Active',
              `The scheduled load shedding for your area has now started and will last until ${schedule.endTime.toLocaleString()}.`
          );
      } else if (status === 'COMPLETED') {
          NotificationService.notifyAffectedCustomers(
              schedule.feederId,
              'Load Shedding Schedule Completed',
              `The scheduled load shedding for your area has been completed. Power is being restored.`
          );
      }

      return await this.getById(id);
  }

  static async delete(id: string, userId: string) {
      const schedule = await prisma.scheduledOutage.findUnique({ where: { id } });
      if (!schedule) throw new NotFoundError('Schedule not found');
      
      if (schedule.status === 'ACTIVE') {
          throw new ValidationError('Cannot delete an active schedule. Complete or cancel it first.');
      }

      await prisma.scheduledOutage.update({
          where: { id },
          data: { deletedAt: new Date() }
      });

      await createAuditLog({
          userId,
          action: 'DELETE',
          entity: 'ScheduledOutage',
          entityId: id
      });
  }

  static async getFairnessStats() {
      // Calculates cumulative shed hours per feeder
      const schedules = await prisma.scheduledOutage.findMany({
          where: { status: 'COMPLETED' },
          select: { feederId: true, startTime: true, endTime: true, feeder: { select: { name: true } } }
      });

      const stats: Record<string, { feederName: string, totalHours: number }> = {};
      let totalSystemHours = 0;

      schedules.forEach(s => {
          const hours = (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60);
          if (!stats[s.feederId]) {
              stats[s.feederId] = { feederName: s.feeder.name, totalHours: 0 };
          }
          stats[s.feederId].totalHours += hours;
          totalSystemHours += hours;
      });

      const numFeeders = Object.keys(stats).length || 1;
      const averageHours = totalSystemHours / numFeeders;

      return {
          averageSystemHours: averageHours,
          feeders: Object.entries(stats).map(([id, data]) => ({
              feederId: id,
              feederName: data.feederName,
              totalHours: data.totalHours,
              deviationFromAverage: data.totalHours - averageHours
          })).sort((a, b) => b.totalHours - a.totalHours)
      };
  }
}
