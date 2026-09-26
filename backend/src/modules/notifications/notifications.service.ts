import { prisma } from '../../core/database/prisma';

export class NotificationsService {
  /**
   * List notifications for user or global notifications
   */
  static async listNotifications(userId?: string) {
    const where: any = {
      OR: [{ userId: null }],
    };
    if (userId) {
      where.OR.push({ userId });
    }

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    });

    return {
      items: items.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        severity: n.severity,
        linkUrl: n.linkUrl,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId?: string) {
    const where: any = { isRead: false };
    if (userId) {
      where.OR = [{ userId: null }, { userId }];
    }

    return await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
  }
}
