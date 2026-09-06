import { Router, raw } from 'express';
import { PaymentController } from './payment.controller.js';
import { validate } from '../../middleware/validate.js';
import { initiatePaymentSchema, getPaymentsQuerySchema } from './payment.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Webhook is mounted in app.ts before express.json() to preserve raw body

router.use(authenticate);

router.post(
  '/initiate',
  authorize('CUSTOMER'),
  validate(initiatePaymentSchema),
  PaymentController.initiate,
);
router.get(
  '/my-payments',
  authorize('CUSTOMER'),
  validate(getPaymentsQuerySchema),
  PaymentController.getMyPayments,
);
router.post('/:id/refund', authorize('ADMIN'), PaymentController.refund);

export default router;
