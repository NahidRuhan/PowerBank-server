import { Router } from 'express';
import { SubstationController } from './substation.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createSubstationSchema,
  updateSubstationSchema,
  getSubstationsQuerySchema,
} from './substation.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize('ADMIN', 'OPERATOR'),
  validate(createSubstationSchema),
  SubstationController.create,
);
router.get('/', validate(getSubstationsQuerySchema), SubstationController.getAll);
router.get('/:id', SubstationController.getById);
router.patch(
  '/:id',
  authorize('ADMIN', 'OPERATOR'),
  validate(updateSubstationSchema),
  SubstationController.update,
);
router.delete('/:id', authorize('ADMIN'), SubstationController.delete);

export default router;
