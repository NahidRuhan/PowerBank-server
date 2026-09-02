import { Request, Response, NextFunction } from 'express';
import { SubstationService } from './substation.service.js';
import { sendSuccess } from '../../lib/response.js';

export class SubstationController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const substation = await SubstationService.create(req.body, req.user!.id);
      return sendSuccess(res, substation, 'Substation created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubstationService.getAll(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const substation = await SubstationService.getById(req.params.id);
      return sendSuccess(res, substation);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const substation = await SubstationService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, substation, 'Substation updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await SubstationService.delete(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Substation deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
