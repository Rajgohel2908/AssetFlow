import { Router } from 'express';
import {
  createDepartment, getDepartments, getDepartment,
  updateDepartment, deleteDepartment,
} from '../controllers/department.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', requireRole('ADMIN'), createDepartment);
router.put('/:id', requireRole('ADMIN'), updateDepartment);
router.delete('/:id', requireRole('ADMIN'), deleteDepartment);

export default router;
