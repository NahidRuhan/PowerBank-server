import { Router } from 'express';
import { IncidentController } from './incident.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  createIncidentSchema,
  updateIncidentSchema,
  getIncidentsQuerySchema,
} from './incident.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// Customers can view incidents, but only OPERATOR/ADMIN can report and update them
router.post(
  '/',
  authorize('ADMIN', 'OPERATOR'),
  validate(createIncidentSchema),
  IncidentController.create,
);
router.get('/', validate(getIncidentsQuerySchema), IncidentController.getAll);
router.get('/:id', IncidentController.getById);
router.patch(
  '/:id',
  authorize('ADMIN', 'OPERATOR'),
  validate(updateIncidentSchema),
  IncidentController.update,
);

export default router;
