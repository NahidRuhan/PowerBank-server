import { Request, Response, NextFunction } from 'express';
import { QuotaService } from './quota.service.js';
import { sendSuccess } from '../../lib/response.js';

export class QuotaController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const quota = await QuotaService.create(req.body, req.user!.id);
      return sendSuccess(res, quota, 'Quota created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await QuotaService.getAll(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const quota = await QuotaService.getById(req.params.id);
      return sendSuccess(res, quota);
    } catch (error) {
      next(error);
    }
  }
}
