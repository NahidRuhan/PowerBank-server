import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../lib/response.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      return sendSuccess(res, user, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refreshToken(req.body.refreshToken);
      return sendSuccess(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
      try {
          if (req.user) {
              await AuthService.logout(req.user.id);
          }
          return sendSuccess(res, null, 'Logout successful');
      } catch (error) {
          next(error);
      }
  }
}
