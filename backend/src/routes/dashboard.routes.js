import { Router } from 'express';
import { getKPIs, getQuickStats } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(requireMinRole('DEPARTMENT_HEAD'));

router.get('/kpis', getKPIs);
router.get('/quick-stats', getQuickStats);

export default router;
