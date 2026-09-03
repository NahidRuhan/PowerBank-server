import { Router } from 'express';
import { QuotaController } from './quota.controller.js';
import { validate } from '../../middleware/validate.js';
import { createQuotaSchema, getQuotasQuerySchema } from './quota.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), validate(createQuotaSchema), QuotaController.create);
router.get('/', authorize('ADMIN', 'OPERATOR'), validate(getQuotasQuerySchema), QuotaController.getAll);
router.get('/:id', authorize('ADMIN', 'OPERATOR'), QuotaController.getById);

export default router;
