import { Router } from 'express';
import { AreaController } from './area.controller.js';
import { validate } from '../../middleware/validate.js';
import { createAreaSchema, updateAreaSchema, getAreasQuerySchema, searchAreasQuerySchema } from './area.validation.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('ADMIN', 'OPERATOR'), validate(createAreaSchema), AreaController.create);
router.get('/', validate(getAreasQuerySchema), AreaController.getAll);
router.get('/search', validate(searchAreasQuerySchema), AreaController.search);
router.get('/:id', AreaController.getById);
router.patch('/:id', authorize('ADMIN', 'OPERATOR'), validate(updateAreaSchema), AreaController.update);
router.delete('/:id', authorize('ADMIN'), AreaController.delete);

export default router;
