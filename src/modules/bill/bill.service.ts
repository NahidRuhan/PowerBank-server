import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';
import { parsePagination } from '../../lib/pagination.js';

export class BillService {
  static async generateBills(
    data: { month: string; baseAmount: number; dueDate: string },
    adminId: string,
  ) {
    // Find all customers with an area assigned
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER', areaId: { not: null }, deletedAt: null },
      select: { id: true, areaId: true },
    });

    let generatedCount = 0;

    for (const customer of customers) {
      if (!customer.areaId) continue;

      // Skip if bill already exists for this month
      const existing = await prisma.bill.findUnique({
        where: { userId_month: { userId: customer.id, month: data.month } },
      });

      if (!existing) {
        await prisma.bill.create({
          data: {
            userId: customer.id,
            areaId: customer.areaId,
            month: data.month,
            amount: data.baseAmount,
            totalAmount: data.baseAmount,
            dueDate: new Date(data.dueDate),
          },
        });
        generatedCount++;
      }
    }

    await createAuditLog({
      userId: adminId,
      action: 'GENERATE_BILLS',
      entity: 'Bill',
      entityId: `month:${data.month}`,
      changes: { generatedCount },
    });

    return { generatedCount };
  }

  static async getAll(query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.month) where.month = query.month;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, meterNumber: true } },
        },
      }),
      prisma.bill.count({ where }),
    ]);

    return {
      bills,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getMyBills(userId: string, query: any) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: any = { userId };
    if (query.status) where.status = query.status;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take,
        orderBy: { month: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);

    return {
      bills,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string, userId: string, role: string) {
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        payments: true,
        user: { select: { name: true, meterNumber: true } },
      },
    });

    if (!bill) throw new NotFoundError('Bill not found');

    // Customers can only see their own bills
    if (role === 'CUSTOMER' && bill.userId !== userId) {
      throw new NotFoundError('Bill not found');
    }

    return bill;
  }
}
