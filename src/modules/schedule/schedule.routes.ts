import { Router } from 'express';
import { ScheduleController } from './schedule.controller.js';
import { validate } from '../../middleware/validate.js';
import { createScheduleSchema, updateScheduleStatusSchema, getSchedulesQuerySchema } from './schedule.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'OPERATOR'), validate(createScheduleSchema), ScheduleController.create);
router.get('/', validate(getSchedulesQuerySchema), ScheduleController.getAll);
router.get('/fairness', authorize('ADMIN', 'OPERATOR'), ScheduleController.getFairness);
router.get('/:id', ScheduleController.getById);
router.patch('/:id/status', authorize('ADMIN', 'OPERATOR'), validate(updateScheduleStatusSchema), ScheduleController.updateStatus);
router.delete('/:id', authorize('ADMIN'), ScheduleController.delete);

export default router;
