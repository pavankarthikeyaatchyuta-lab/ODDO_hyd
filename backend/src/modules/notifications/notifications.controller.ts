import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { AuthenticatedRequest } from '../../core/middleware/auth-guard';

export class NotificationsController {
  static async listNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationsService.listNotifications(req.user?.id);
      res.status(200).json({
        success: true,
        data: result.items,
        unreadCount: result.unreadCount,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationsService.markAsRead(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationsService.markAllAsRead(req.user?.id);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
