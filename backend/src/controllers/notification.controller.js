import prisma from '../lib/prisma.js';
import { ApiError } from '../utils/apiError.js';

// ─── Notification Controller ──────────────────────────────────────────────────

/**
 * GET /notifications
 * Returns notifications for the currently authenticated user.
 */
export const getNotifications = async (req, res) => {
  const { page = 1, limit = 30, unreadOnly } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    userId: req.user.userId,
    ...(unreadOnly === 'true' && { isRead: false }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
  ]);

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      page: Number(page), limit: Number(limit), total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

/**
 * PATCH /notifications/:id/read
 */
export const markNotificationRead = async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) throw new ApiError(404, 'Notification not found');
  if (notification.userId !== req.user.userId) throw new ApiError(403, 'Cannot access this notification');

  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });

  res.json({ success: true, message: 'Notification marked as read' });
};

/**
 * PATCH /notifications/read-all
 */
export const markAllNotificationsRead = async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user.userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true, message: `${result.count} notification(s) marked as read` });
};

/**
 * DELETE /notifications/:id
 */
export const deleteNotification = async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) throw new ApiError(404, 'Notification not found');
  if (notification.userId !== req.user.userId) throw new ApiError(403, 'Cannot access this notification');

  await prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Notification deleted' });
};
