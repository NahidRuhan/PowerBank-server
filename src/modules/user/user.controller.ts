import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';
import { sendSuccess } from '../../lib/response.js';
import { uploadToCloudinary } from '../../middleware/upload.js';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getProfile(req.user!.id);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updateData = { ...req.body };
      
      if (req.file) {
        updateData.avatar = await uploadToCloudinary(req.file.buffer, 'powerbank/avatars');
      }

      const user = await UserService.updateProfile(req.user!.id, updateData);
      return sendSuccess(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.changePassword(req.user!.id, req.body);
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}
