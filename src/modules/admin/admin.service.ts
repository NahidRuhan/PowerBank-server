import { createAuditLog } from '../../lib/auditLog.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { parsePagination } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';

export class AdminService {
  static async getDashboardStats() {
    const cacheKey = 'admin:dashboard:stats';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      roleGroups,
      activeIncidents,
      reportedToday,
      resolvedToday,
      activeSchedules,
      upcomingSchedules,
      completedSchedules,
      revenueQuery,
      billsPaid,
      billsOverdue,
      incidentFeederGroups,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
      prisma.outageIncident.count({
        where: { status: { not: 'RESOLVED' } },
      }),
      prisma.outageIncident.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.outageIncident.count({
        where: { resolvedAt: { gte: todayStart }, status: 'RESOLVED' },
      }),
      prisma.scheduledOutage.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.scheduledOutage.count({
        where: { status: 'SCHEDULED' },
      }),
      prisma.scheduledOutage.count({
        where: { status: 'COMPLETED', updatedAt: { gte: monthStart } },
      }),
      prisma.bill.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'PAID', updatedAt: { gte: monthStart } },
      }),
      prisma.bill.count({ where: { status: 'PAID' } }),
      prisma.bill.count({ where: { status: 'OVERDUE' } }),
      prisma.outageIncident.groupBy({
        by: ['feederId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Format roles
    const usersByRole = roleGroups.reduce(
      (acc, curr) => {
        acc[curr.role] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Fetch top affected areas (via feeders)
    const topFeeders = await prisma.feeder.findMany({
      where: { id: { in: incidentFeederGroups.map((g) => g.feederId) } },
      include: { areas: true },
    });

    const topAffectedAreas = incidentFeederGroups.map((group) => {
      const feeder = topFeeders.find((f) => f.id === group.feederId);
      return {
        feederCode: feeder?.code,
        incidentCount: group._count.id,
        areas: feeder?.areas.map((a) => a.name) || [],
      };
    });

    // Determine fairness (most/least shed feeders based on hours)
    const { ScheduleService } = await import('../schedule/schedule.service.js');
    const fairnessStats = await ScheduleService.getFairnessStats();
    
    let mostShedFeeder = null;
    let leastShedFeeder = null;

    if (fairnessStats.feeders.length > 0) {
      const most = fairnessStats.feeders[0];
      const least = fairnessStats.feeders[fairnessStats.feeders.length - 1];
      
      const feederCodes = await prisma.feeder.findMany({
        where: { id: { in: [most.feederId, least.feederId] } },
        select: { id: true, code: true }
      });

      mostShedFeeder = {
        code: feederCodes.find(f => f.id === most.feederId)?.code || most.feederName,
        hoursThisMonth: most.totalHours,
      };

      leastShedFeeder = {
        code: feederCodes.find(f => f.id === least.feederId)?.code || least.feederName,
        hoursThisMonth: least.totalHours,
      };
    }

    const data = {
      users: {
        total: totalUsers,
        byRole: usersByRole,
      },
      outages: {
        active: activeIncidents,
        reportedToday,
        resolvedToday,
      },
      schedules: {
        active: activeSchedules,
        upcoming: upcomingSchedules,
        completedThisMonth: completedSchedules,
      },
      billing: {
        revenueThisMonth: revenueQuery._sum.totalAmount || 0,
        paid: billsPaid,
        overdue: billsOverdue,
      },
      fairness: {
        mostShedFeeder,
        leastShedFeeder,
        averageHoursPerFeeder: fairnessStats.averageSystemHours,
      },
      topAffectedAreas,
    };

    // Cache for 5 mins
    await redis.setex(cacheKey, 300, JSON.stringify(data));
    return data;
  }

  static async getUsers(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const { search, role } = query;

    const where: any = { deletedAt: null };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          meterNumber: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async updateUserRole(adminId: string, userId: string, newRole: string) {
    if (adminId === userId) {
      throw new ValidationError('You cannot change your own role');
    }

    const user = await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundError('User not found');

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    });

    await createAuditLog({
      userId: adminId,
      action: 'UPDATE_ROLE',
      entity: 'User',
      entityId: userId,
      changes: { role: { from: user.role, to: newRole } },
    });

    return updatedUser;
  }

  static async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new ValidationError('You cannot delete your own account');
    }

    const user = await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundError('User not found');

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId: adminId,
      action: 'DELETE',
      entity: 'User',
      entityId: userId,
    });
  }

  static async getAuditLogs(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const { entity, action, userId, from, to } = query;

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
