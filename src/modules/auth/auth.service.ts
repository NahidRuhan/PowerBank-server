import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { env } from '../../lib/env.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';

export class AuthService {
  static async register(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    if (data.meterNumber) {
      const existingMeter = await prisma.user.findUnique({
        where: { meterNumber: data.meterNumber },
      });
      if (existingMeter) {
        throw new ConflictError('Meter number already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        meterNumber: data.meterNumber,
        isVerified: true, // Auto verify for now
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(data: any) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

      const storedToken = await redis.get(`session:${decoded.id}`);
      if (storedToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  static async logout(userId: string) {
    await redis.del(`session:${userId}`);
  }

  static async generateTokens(user: any) {
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Store refresh token in redis
    await redis.set(`session:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }
}
