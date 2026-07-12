import { Router } from 'express';
import {
  getEmployees, getEmployee, updateRole, updateStatus,
} from '../controllers/employee.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', requireMinRole('DEPARTMENT_HEAD'), getEmployees);
router.get('/:id', requireMinRole('DEPARTMENT_HEAD'), getEmployee);

// BUSINESS RULE 2: The ONLY endpoint that changes a user's role — Admin only
router.patch('/:id/role', requireRole('ADMIN'), updateRole);
router.patch('/:id/status', requireRole('ADMIN'), updateStatus);

export default router;
