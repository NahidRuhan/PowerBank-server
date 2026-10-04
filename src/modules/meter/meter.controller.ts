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
      const result = await MeterService.getAllMeters(req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMeter(req: Request, res: Response, next: NextFunction) {
    try {
      await MeterService.deleteMeter(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Meter deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
