import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static async getKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, categoryId, startDate, endDate } = req.query;
      const kpis = await DashboardService.getDashboardKPIs({
        warehouseId: warehouseId as string,
        categoryId: categoryId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.status(200).json({
        success: true,
        data: kpis,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 6;
      const activity = await DashboardService.getRecentActivity(limit);

      res.status(200).json({
        success: true,
        data: activity,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await DashboardService.getStockAlerts();

      res.status(200).json({
        success: true,
        data: alerts,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
