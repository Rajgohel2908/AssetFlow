import { Router } from 'express';
import {
  createAuditCycle, getAuditCycles, getAuditCycle,
  updateAuditItem, closeAuditCycle,
} from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getAuditCycles);
router.get('/:id', getAuditCycle);
router.post('/', requireMinRole('ASSET_MANAGER'), createAuditCycle);
router.patch('/:id/items/:assetId', updateAuditItem); // Auditors can update items
router.post('/:id/close', requireMinRole('ASSET_MANAGER'), closeAuditCycle);

export default router;
