import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../lib/response.js';
import { AdminService } from './admin.service.js';

export class AdminController {
  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      sendSuccess(res, stats, 'Dashboard stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getUsers(req.query);
      sendSuccess(res, result, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req.user as any).id;
      const { id } = req.params;
      const { role } = req.body;
      const updatedUser = await AdminService.updateUserRole(adminId, id, role);
      sendSuccess(res, updatedUser, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req.user as any).id;
      const { id } = req.params;
      await AdminService.deleteUser(adminId, id);
      sendSuccess(res, null, 'User deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminService.getAuditLogs(req.query);
      sendSuccess(res, result, 'Audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
