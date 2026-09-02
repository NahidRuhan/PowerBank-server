import { Router } from 'express';
import { FeederController } from './feeder.controller.js';
import { validate } from '../../middleware/validate.js';
import { createFeederSchema, updateFeederSchema, updateFeederStatusSchema, getFeedersQuerySchema } from './feeder.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'OPERATOR'), validate(createFeederSchema), FeederController.create);
router.get('/', validate(getFeedersQuerySchema), FeederController.getAll);
router.get('/:id', FeederController.getById);
router.patch('/:id', authorize('ADMIN', 'OPERATOR'), validate(updateFeederSchema), FeederController.update);
router.patch('/:id/status', authorize('ADMIN', 'OPERATOR'), validate(updateFeederStatusSchema), FeederController.updateStatus);
router.delete('/:id', authorize('ADMIN'), FeederController.delete);

export default router;
