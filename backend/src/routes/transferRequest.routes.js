import { Router } from 'express';
import {
  createTransferRequest, approveTransfer, rejectTransfer, getTransferRequests,
} from '../controllers/transferRequest.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getTransferRequests);
router.post('/', createTransferRequest); // Any authenticated user can request
router.patch('/:id/approve', requireMinRole('DEPARTMENT_HEAD'), approveTransfer);
router.patch('/:id/reject', requireMinRole('DEPARTMENT_HEAD'), rejectTransfer);

export default router;
