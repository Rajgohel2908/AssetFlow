import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { notifyService } from './notification.service.js';
import { activityLogService } from './activityLog.service.js';

// ─── Overdue Allocation Cron Job ──────────────────────────────────────────────
//
// Runs every hour. Marks allocations past their expectedReturnDate as OVERDUE and
// notifies the asset holder + all Asset Managers.

const checkOverdueAllocations = async () => {
  const now = new Date();

  try {
    // Find ACTIVE allocations past their dueDate that aren't already OVERDUE
    const overdueAllocations = await prisma.allocation.findMany({
      where: {
        status: 'ACTIVE',
        expectedReturnDate: { lt: now },
      },
      include: {
        asset: { select: { id: true, name: true, assetTag: true } },
        holderUser: { select: { id: true, name: true, email: true } },
        holderDepartment: { select: { id: true, name: true } },
      },
    });

    if (overdueAllocations.length === 0) return;

    console.log(`[Overdue Cron] Found ${overdueAllocations.length} overdue allocation(s)`);

    for (const allocation of overdueAllocations) {
      // Mark as OVERDUE
      await prisma.allocation.update({
        where: { id: allocation.id },
        data: { status: 'OVERDUE' },
      });

      // Notify the holder
      if (allocation.holderUserId) {
        await notifyService.trigger(
          'ALLOCATION_OVERDUE',
          `Your allocation of ${allocation.asset.name} (${allocation.asset.assetTag}) is overdue. Please return it immediately.`,
          [allocation.holderUserId],
          { entityType: 'Allocation', entityId: allocation.id }
        );
      }

      // Notify all Asset Managers
      await notifyService.notifyManagers(
        'ALLOCATION_OVERDUE',
        `Overdue return: ${allocation.asset.name} (${allocation.asset.assetTag}) held by ${allocation.holderUser?.name ?? allocation.holderDepartment?.name ?? 'Unknown'}`,
        { entityType: 'Allocation', entityId: allocation.id }
      );

      // Log to activity trail
      await activityLogService.logSystem(
        'ALLOCATION_MARKED_OVERDUE',
        'Allocation',
        allocation.id,
        { holderUserId: allocation.holderUserId, assetId: allocation.asset.id, expectedReturnDate: allocation.expectedReturnDate }
      );
    }
  } catch (err) {
    console.error('[Overdue Cron] Error:', err.message);
  }
};

/**
 * Start the overdue allocations cron job.
 * Runs every hour at minute 0.
 */
export const startOverdueCron = () => {
  const job = cron.schedule('0 * * * *', checkOverdueAllocations, {
    scheduled: true,
    timezone: 'UTC',
  });

  console.log('[Overdue Cron] Started — runs every hour');
  return job;
};
