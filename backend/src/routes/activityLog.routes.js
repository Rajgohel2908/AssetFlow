import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityLog.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(requireMinRole('ASSET_MANAGER'));

router.get('/', getActivityLogs);

export default router;
