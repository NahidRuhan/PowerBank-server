import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { MeterController } from './meter.controller.js';
import { createMeterSchema, deleteMeterSchema } from './meter.validation.js';

export const meterRoutes = Router();

// Only ADMIN and OPERATOR can manage meters
meterRoutes.use(authenticate, authorize('ADMIN', 'OPERATOR'));

meterRoutes.post('/', validate(createMeterSchema), MeterController.createMeter);

meterRoutes.get('/', MeterController.getAllMeters);

meterRoutes.delete('/:id', validate(deleteMeterSchema), MeterController.deleteMeter);
