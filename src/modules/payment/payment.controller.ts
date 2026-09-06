import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service.js';
import { sendSuccess } from '../../lib/response.js';

export class PaymentController {
  static async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.initiatePayment(req.body.billId, req.user!.id);
      sendSuccess(res, { data: result });
    } catch (error) {
      next(error);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const result = await PaymentService.handleWebhook(signature, req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).send(`Webhook Error`);
    }
  }

  static async getMyPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.getMyPayments(req.user!.id, req.query);
      sendSuccess(res, { data: result.payments, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async refund(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.refundPayment(req.params.id);
      sendSuccess(res, { data: result });
    } catch (error) {
      next(error);
    }
  }
}
