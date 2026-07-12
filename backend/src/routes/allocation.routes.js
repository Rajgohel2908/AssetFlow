import { Router } from 'express';
import {
  createAllocation, getAllocations, getAllocation, returnAllocation,
} from '../controllers/allocation.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getAllocations);
router.get('/:id', getAllocation);
router.post('/', requireMinRole('ASSET_MANAGER'), createAllocation);
router.post('/:id/return', returnAllocation); // Employee can return their own

export default router;
