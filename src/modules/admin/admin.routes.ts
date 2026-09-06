import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { AdminController } from './admin.controller.js';
import {
  getAuditLogsQuerySchema,
  getUsersQuerySchema,
  updateRoleSchema,
} from './admin.validation.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', AdminController.getDashboardStats);

router.get('/users', validate(getUsersQuerySchema), AdminController.getUsers);

router.patch('/users/:id/role', validate(updateRoleSchema), AdminController.updateUserRole);

router.delete('/users/:id', AdminController.deleteUser);

router.get('/audit-logs', validate(getAuditLogsQuerySchema), AdminController.getAuditLogs);

export default router;
