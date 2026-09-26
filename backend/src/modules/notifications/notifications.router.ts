import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../core/middleware/auth-guard';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/', NotificationsController.listNotifications);
notificationsRouter.patch('/:id/read', NotificationsController.markAsRead);
notificationsRouter.post('/read-all', NotificationsController.markAllAsRead);
