import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { env } from '../../lib/env.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../lib/auditLog.js';

export class AuthService {
  static async register(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    let areaId: string | null = null;
    let meterId: string | null = null;

    if (data.meterNumber) {
      const meter = await prisma.meter.findUnique({
        where: { number: data.meterNumber },
      });

      if (!meter) {
        throw new NotFoundError('Invalid meter number. Please contact the utility.');
      }
      if (meter.userId) {
        throw new ConflictError('Meter number already registered to another user');
      }

      areaId = meter.areaId;
      meterId = meter.id;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        meterNumber: data.meterNumber,
        phoneNumber: data.phoneNumber,
        avatar: data.avatar,
        areaId: areaId,
        isVerified: true, // Auto verify for now
      },
    });

    if (meterId) {
      await prisma.meter.update({
        where: { id: meterId },
        data: { userId: user.id },
      });
    }

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

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak whether user exists or not
      return { message: 'If the email exists, an OTP has been sent' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in redis with 5-minute expiry
    await redis.set(`otp:${email}`, otp, 'EX', 300);

    // In a real application, send this OTP via email or SMS
    // For this assignment/API, we can just log it or return it in development
    console.log(`[DEV ONLY] OTP for ${email} is ${otp}`);

    await createAuditLog({
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUESTED',
      entity: 'User',
      entityId: user.id,
    });

    return { message: 'If the email exists, an OTP has been sent' };
  }

  static async resetPassword(data: any) {
    const storedOtp = await redis.get(`otp:${data.email}`);

    if (!storedOtp || storedOtp !== data.otp) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate the OTP after successful use
    await redis.del(`otp:${data.email}`);
    // Invalidate all existing sessions
    await redis.del(`session:${user.id}`);

    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user.id,
    });
  }
}
