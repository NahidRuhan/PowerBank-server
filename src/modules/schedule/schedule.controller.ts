import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from './schedule.service.js';
import { sendSuccess } from '../../lib/response.js';

export class ScheduleController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ScheduleService.create(req.body, req.user!.id);
      return sendSuccess(res, result.schedule, result.warning || 'Schedule created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ScheduleService.getAll(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.getById(req.params.id);
      return sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.updateStatus(req.params.id, req.body.status, req.user!.id);
      return sendSuccess(res, schedule, 'Schedule status updated');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ScheduleService.delete(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Schedule deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getFairness(req: Request, res: Response, next: NextFunction) {
      try {
          const stats = await ScheduleService.getFairnessStats();
          return sendSuccess(res, stats);
      } catch (error) {
          next(error);
      }
  }
}
