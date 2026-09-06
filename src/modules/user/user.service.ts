import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { UnauthorizedError, ConflictError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedError('User not found');

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(userId: string, data: any) {
    if (data.meterNumber) {
      const existing = await prisma.user.findUnique({ where: { meterNumber: data.meterNumber } });
      if (existing && existing.id !== userId) {
        throw new ConflictError('Meter number is already registered to another user');
      }
    }

    const oldUser = await prisma.user.findUnique({ where: { id: userId } });

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE_PROFILE',
      entity: 'User',
      entityId: userId,
      changes: {
        name: { from: oldUser?.name, to: user.name },
        meterNumber: { from: oldUser?.meterNumber, to: user.meterNumber },
      },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async changePassword(userId: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new UnauthorizedError('User not found or uses social login');
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await createAuditLog({
      userId,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: userId,
    });
  }
}
