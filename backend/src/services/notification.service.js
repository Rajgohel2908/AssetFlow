import prisma from '../lib/prisma.js';

// ─── Notification Service ─────────────────────────────────────────────────────
//
// Internal service — called from controllers on every state-changing event.
// Creates Notification rows in the DB. Polling-based (no websockets needed).

/**
 * Trigger a notification for one or more users.
 *
 * @param {string}   eventType   - e.g. 'ALLOCATION_CREATED', 'MAINTENANCE_APPROVED'
 * @param {string}   message     - Human-readable notification text
 * @param {string[]} recipientIds - Array of User IDs to notify
 * @param {object}   [meta]      - Optional: { entityType, entityId }
 */
export const notifyService = {
  async trigger(eventType, message, recipientIds, meta = {}) {
    if (!recipientIds || recipientIds.length === 0) return;

    // Deduplicate recipient IDs
    const uniqueIds = [...new Set(recipientIds.filter(Boolean))];

    await prisma.notification.createMany({
      data: uniqueIds.map((userId) => ({
        userId,
        eventType,
        message,
        entityType: meta.entityType ?? null,
        entityId: meta.entityId ?? null,
        isRead: false,
      })),
    });
  },

  /**
   * Notify all users with a given role.
   * @param {string} eventType
   * @param {string} message
   * @param {string} role - e.g. 'ADMIN', 'ASSET_MANAGER'
   * @param {object} [meta]
   */
  async triggerForRole(eventType, message, role, meta = {}) {
    const users = await prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    await this.trigger(eventType, message, ids, meta);
  },

  /**
   * Notify all ADMIN users.
   */
  async notifyAdmins(eventType, message, meta = {}) {
    await this.triggerForRole(eventType, message, 'ADMIN', meta);
  },

  /**
   * Notify all ASSET_MANAGER users.
   */
  async notifyManagers(eventType, message, meta = {}) {
    await this.triggerForRole(eventType, message, 'ASSET_MANAGER', meta);
  },
};
