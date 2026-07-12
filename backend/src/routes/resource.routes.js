import { Router } from 'express';
import {
  createResource, getResources, getResource, updateResource, deleteResource,
} from '../controllers/resource.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole, requireRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getResources);
router.get('/:id', getResource);
router.post('/', requireMinRole('ASSET_MANAGER'), createResource);
router.put('/:id', requireMinRole('ASSET_MANAGER'), updateResource);
router.delete('/:id', requireRole('ADMIN'), deleteResource);

export default router;
