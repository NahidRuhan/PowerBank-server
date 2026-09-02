import { Router } from 'express';
import { ZoneController } from './zone.controller.js';
import { validate } from '../../middleware/validate.js';
import { createZoneSchema, updateZoneSchema, getZonesQuerySchema } from './zone.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'OPERATOR'), validate(createZoneSchema), ZoneController.create);
router.get('/', validate(getZonesQuerySchema), ZoneController.getAll);
router.get('/:id', ZoneController.getById);
router.patch('/:id', authorize('ADMIN', 'OPERATOR'), validate(updateZoneSchema), ZoneController.update);
router.delete('/:id', authorize('ADMIN'), ZoneController.delete);

export default router;
