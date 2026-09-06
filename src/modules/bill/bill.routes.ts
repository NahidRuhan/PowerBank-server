import { Router } from 'express';
import { BillController } from './bill.controller.js';
import { validate } from '../../middleware/validate.js';
import { generateBillsSchema, getBillsQuerySchema } from './bill.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post(
  '/generate',
  authorize('ADMIN'),
  validate(generateBillsSchema),
  BillController.generate,
);
router.get('/', authorize('ADMIN'), validate(getBillsQuerySchema), BillController.getAll);
router.get(
  '/my-bills',
  authorize('CUSTOMER'),
  validate(getBillsQuerySchema),
  BillController.getMyBills,
);
router.get('/:id', BillController.getById);

export default router;
