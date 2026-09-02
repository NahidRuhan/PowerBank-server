import { Request, Response, NextFunction } from 'express';
import { ZoneService } from './zone.service.js';
import { sendSuccess } from '../../lib/response.js';

export class ZoneController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await ZoneService.create(req.body, req.user!.id);
      return sendSuccess(res, zone, 'Zone created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ZoneService.getAll(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await ZoneService.getById(req.params.id);
      return sendSuccess(res, zone);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await ZoneService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, zone, 'Zone updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ZoneService.delete(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Zone deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
