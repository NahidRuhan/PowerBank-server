import { Request, Response, NextFunction } from 'express';
import { BillService } from './bill.service.js';
import { sendSuccess } from '../../lib/response.js';

export class BillController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillService.generateBills(req.body, req.user!.id);
      sendSuccess(res, { count: result.generatedCount }, 'Bills generated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillService.getAll(req.query);
      sendSuccess(res, {
        bills: result.bills,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBills(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillService.getMyBills(req.user!.id, req.query);
      sendSuccess(res, {
        bills: result.bills,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const bill = await BillService.getById(req.params.id, req.user!.id, req.user!.role);
      sendSuccess(res, bill);
    } catch (error) {
      next(error);
    }
  }

  static async processOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BillService.processOverdueBills();
      sendSuccess(res, { count: result.processedCount }, 'Processed overdue bills successfully');
    } catch (error) {
      next(error);
    }
  }
}
