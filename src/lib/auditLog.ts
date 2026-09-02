import { prisma } from './prisma.js';

interface AuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, { from: any; to: any }>;
  ipAddress?: string;
}

export const createAuditLog = async ({
  userId,
  action,
  entity,
  entityId,
  changes,
  ipAddress,
}: AuditLogParams) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes: changes ? (changes as any) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
