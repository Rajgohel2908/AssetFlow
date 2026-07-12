import { Router } from 'express';
import {
  createMaintenanceRequest, getMaintenanceRequests, getMaintenanceRequest,
  approveMaintenanceRequest, assignTechnician, resolveMaintenanceRequest,
} from '../controllers/maintenance.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getMaintenanceRequests);
router.get('/:id', getMaintenanceRequest);
router.post('/', createMaintenanceRequest); // Any user can raise maintenance
router.patch('/:id/approve', requireMinRole('ASSET_MANAGER'), approveMaintenanceRequest);
router.patch('/:id/assign-technician', requireMinRole('ASSET_MANAGER'), assignTechnician);
router.patch('/:id/resolve', requireMinRole('ASSET_MANAGER'), resolveMaintenanceRequest);

export default router;
