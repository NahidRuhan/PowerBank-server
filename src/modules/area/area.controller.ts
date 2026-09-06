import { Request, Response, NextFunction } from 'express';
import { AreaService } from './area.service.js';
import { sendSuccess } from '../../lib/response.js';

export class AreaController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await AreaService.create(req.body, req.user!.id);
      return sendSuccess(res, area, 'Area created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AreaService.getAll(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AreaService.search(req.query.q as string);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await AreaService.getById(req.params.id);
      return sendSuccess(res, area);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await AreaService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, area, 'Area updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await AreaService.delete(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Area deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
