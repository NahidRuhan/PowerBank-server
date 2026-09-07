import { Request, Response, NextFunction } from 'express';
import { MeterService } from './meter.service.js';

export class MeterController {
  static async createMeter(req: Request, res: Response, next: NextFunction) {
    try {
      const meter = await MeterService.createMeter(req.body);
      res.status(201).json({
        success: true,
        data: meter,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllMeters(req: Request, res: Response, next: NextFunction) {
    try {
      const meters = await MeterService.getAllMeters();
      res.status(200).json({
        success: true,
        data: meters,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMeter(req: Request, res: Response, next: NextFunction) {
    try {
      await MeterService.deleteMeter(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
