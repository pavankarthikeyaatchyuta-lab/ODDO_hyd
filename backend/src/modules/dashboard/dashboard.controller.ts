import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static async getKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, locationId, categoryId, documentType, status, startDate, endDate } = req.query;
      const kpis = await DashboardService.getDashboardKPIs({
        warehouseId: warehouseId as string,
        locationId: locationId as string,
        categoryId: categoryId as string,
        documentType: documentType as string,
        status: status as string,
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
      const { limit, warehouseId, locationId, categoryId, documentType, status } = req.query;
      const activity = await DashboardService.getRecentActivity({
        limit: limit ? Number(limit) : 6,
        warehouseId: warehouseId as string,
        locationId: locationId as string,
        categoryId: categoryId as string,
        documentType: documentType as string,
        status: status as string,
      });

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
