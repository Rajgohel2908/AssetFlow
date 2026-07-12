import { Router } from 'express';
import {
  getUtilizationReport, getMaintenanceFrequencyReport,
  getDepartmentSummaryReport, getBookingHeatmapReport, exportReport,
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(requireMinRole('ASSET_MANAGER'));

router.get('/utilization', getUtilizationReport);
router.get('/maintenance-frequency', getMaintenanceFrequencyReport);
router.get('/department-summary', getDepartmentSummaryReport);
router.get('/booking-heatmap', getBookingHeatmapReport);
router.get('/export', exportReport);

export default router;
