import prisma from '../lib/prisma.js';

// ─── Activity Log Service ─────────────────────────────────────────────────────
//
// Called from every controller on state-changing events.
// Creates immutable ActivityLog rows for audit trail.

export const activityLogService = {
  /**
   * Log an action to the activity trail.
   *
   * @param {string|null} actorId    - User ID performing the action (null for system)
   * @param {string}      action     - Action label e.g. 'ASSET_CREATED', 'ROLE_CHANGED'
   * @param {string}      entityType - e.g. 'Asset', 'Allocation', 'User'
   * @param {string}      entityId   - ID of the affected entity
   * @param {object|null} changes    - Before/after snapshot { before, after } or null
   */
  async log(actorId, action, entityType, entityId, changes = null) {
    await prisma.activityLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        entityType,
        entityId,
        changes,
      },
    });
  },

  /**
   * Log a system action (no actor).
   */
  async logSystem(action, entityType, entityId, changes = null) {
    await this.log(null, action, entityType, entityId, changes);
  },
};
