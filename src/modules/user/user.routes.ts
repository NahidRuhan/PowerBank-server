import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from './user.validation.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.get('/me', UserController.getProfile);
router.patch('/me', upload.single('avatar'), validate(updateProfileSchema), UserController.updateProfile);
router.patch('/me/password', validate(changePasswordSchema), UserController.changePassword);

export default router;
