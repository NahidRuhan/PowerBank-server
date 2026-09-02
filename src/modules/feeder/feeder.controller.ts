import { Request, Response, NextFunction } from 'express';
import { FeederService } from './feeder.service.js';
import { sendSuccess } from '../../lib/response.js';

export class FeederController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const feeder = await FeederService.create(req.body, req.user!.id);
      return sendSuccess(res, feeder, 'Feeder created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FeederService.getAll(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const feeder = await FeederService.getById(req.params.id);
      return sendSuccess(res, feeder);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const feeder = await FeederService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, feeder, 'Feeder updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
      try {
          const feeder = await FeederService.updateStatus(req.params.id, req.body.status, req.user!.id);
          return sendSuccess(res, feeder, 'Feeder status updated');
      } catch (error) {
          next(error);
      }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await FeederService.delete(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Feeder deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
