import { Router } from 'express';
import {
  createAsset, getAssets, getAsset, getAssetHistory,
  updateAssetStatus, updateAsset, deleteAsset,
} from '../controllers/asset.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getAssets);
router.get('/:id', getAsset);
router.get('/:id/history', getAssetHistory);

router.post('/', requireMinRole('ASSET_MANAGER'), createAsset);
router.put('/:id', requireMinRole('ASSET_MANAGER'), updateAsset);
router.patch('/:id/status', requireMinRole('ASSET_MANAGER'), updateAssetStatus);
router.delete('/:id', requireRole('ADMIN'), deleteAsset);

export default router;
