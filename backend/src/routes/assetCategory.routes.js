import { Router } from 'express';
import {
  createCategory, getCategories, getCategory,
  updateCategory, deleteCategory,
} from '../controllers/assetCategory.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', requireRole('ADMIN', 'ASSET_MANAGER'), createCategory);
router.put('/:id', requireRole('ADMIN', 'ASSET_MANAGER'), updateCategory);
router.delete('/:id', requireRole('ADMIN'), deleteCategory);

export default router;
