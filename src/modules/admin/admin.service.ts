import { createAuditLog } from '../../lib/auditLog.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { parsePagination } from '../../lib/pagination.js';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { Prisma, Role } from '@prisma/client';
import { GetUsersQuery, GetAuditLogsQuery } from './admin.interface.js';
export class AdminService {
  static async getDashboardStats() {
    const cacheKey = 'admin:dashboard:stats';
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // For weekly outage trend
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    // For yearly revenue trend
    const startOfYear = new Date(now.getFullYear(), 0, 1);

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
      incidentsThisWeek,
      paidBillsThisYear,
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
      prisma.outageIncident.findMany({
        where: { createdAt: { gte: startOfWeek } },
        select: { createdAt: true, resolvedAt: true, status: true }
      }),
      prisma.bill.findMany({
        where: { status: 'PAID', updatedAt: { gte: startOfYear } },
        select: { totalAmount: true, updatedAt: true }
      })
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

    const topAffectedAreasPromises = incidentFeederGroups.map(async (group) => {
      const feeder = topFeeders.find((f) => f.id === group.feederId);
      
      const incidents = await prisma.outageIncident.findMany({
        where: { feederId: group.feederId, status: 'RESOLVED', resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true }
      });
      
      let avgERT = 'N/A';
      if (incidents.length > 0) {
        const totalMs = incidents.reduce((acc, inc) => acc + (inc.resolvedAt!.getTime() - inc.createdAt.getTime()), 0);
        const avgMs = totalMs / incidents.length;
        const hours = Math.floor(avgMs / (1000 * 60 * 60));
        const mins = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
        avgERT = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      }

      return {
        id: feeder?.id || group.feederId,
        name: feeder?.areas.map(a => a.name).join(', ') || feeder?.code || 'Unknown',
        incidents: group._count.id,
        avgERT,
      };
    });
    
    const topAffectedAreas = await Promise.all(topAffectedAreasPromises);

    // Determine fairness
    const { ScheduleService } = await import('../schedule/schedule.service.js');
    const fairnessStats = await ScheduleService.getFairnessStats();
    
    let mostShedFeeder = null;
    let leastShedFeeder = null;
    let fairnessTrend: { name: string; hours: number }[] = [];

    if (fairnessStats.feeders.length > 0) {
      const allFeederCodes = await prisma.feeder.findMany({
        where: { id: { in: fairnessStats.feeders.map(f => f.feederId) } },
        select: { id: true, code: true }
      });

      fairnessTrend = fairnessStats.feeders.slice(0, 7).map(f => ({
        name: allFeederCodes.find(fc => fc.id === f.feederId)?.code || f.feederName,
        hours: Number(f.totalHours.toFixed(1))
      }));

      const most = fairnessStats.feeders[0];
      const least = fairnessStats.feeders[fairnessStats.feeders.length - 1];
      
      mostShedFeeder = {
        code: allFeederCodes.find(f => f.id === most.feederId)?.code || most.feederName,
        hoursThisMonth: most.totalHours,
      };

      leastShedFeeder = {
        code: allFeederCodes.find(f => f.id === least.feederId)?.code || least.feederName,
        hoursThisMonth: least.totalHours,
      };
    }

    // Outage Trend (Weekly)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const outageTrend = days.map(day => ({ name: day, reported: 0, resolved: 0 }));

    incidentsThisWeek.forEach(inc => {
      const dayIndex = (inc.createdAt.getDay() + 6) % 7;
      outageTrend[dayIndex].reported++;
      if (inc.status === 'RESOLVED' && inc.resolvedAt && inc.resolvedAt >= startOfWeek) {
        const resDayIndex = (inc.resolvedAt.getDay() + 6) % 7;
        outageTrend[resDayIndex].resolved++;
      }
    });

    // Revenue Trend (Yearly)
    const revenueByMonth = Array(12).fill(0);
    paidBillsThisYear.forEach(bill => {
      revenueByMonth[bill.updatedAt.getMonth()] += Number(bill.totalAmount);
    });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTrend = revenueByMonth.map((rev, i) => ({ name: monthNames[i], revenue: rev })).slice(0, now.getMonth() + 1);

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
        revenueThisMonth: Number(revenueQuery._sum.totalAmount || 0),
        paid: billsPaid,
        overdue: billsOverdue,
      },
      fairness: {
        mostShedFeeder,
        leastShedFeeder,
        averageHoursPerFeeder: fairnessStats.averageSystemHours,
      },
      topAffectedAreas,
      outageTrend,
      revenueTrend,
      fairnessTrend,
    };

    // Cache for 5 mins
    await redis.setex(cacheKey, 300, JSON.stringify(data));
    return data;
  }

  static async getUsers(query: GetUsersQuery) {
    const { skip, take, page, limit } = parsePagination(query);
    const { search, role } = query;

    const where: Prisma.UserWhereInput = { deletedAt: null };

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
      data: { role: newRole as Role },
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

  static async getAuditLogs(query: GetAuditLogsQuery) {
    const { skip, take, page, limit } = parsePagination(query);
    const { entity, action, userId, from, to } = query;

    const where: Prisma.AuditLogWhereInput = {};
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
