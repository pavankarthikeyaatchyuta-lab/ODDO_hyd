import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../core/middleware/auth-guard';

export const dashboardRouter = Router();

// Authenticated users can access dashboard telemetry
dashboardRouter.use(authenticate);

dashboardRouter.get('/kpis', DashboardController.getKPIs);
dashboardRouter.get('/recent-activity', DashboardController.getRecentActivity);
dashboardRouter.get('/alerts', DashboardController.getStockAlerts);
