import { Request, Response, NextFunction } from 'express';
import { LedgerService } from './ledger.service';

export class LedgerController {
  static async getStockLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        productId,
        warehouseId,
        binId,
        movementType,
        referenceDocType,
        startDate,
        endDate,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await LedgerService.getStockLedger({
        productId: productId as string,
        warehouseId: warehouseId as string,
        binId: binId as string,
        movementType: movementType as any,
        referenceDocType: referenceDocType as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as any,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMoveHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, warehouseId, movementType, limit } = req.query;
      const history = await LedgerService.getMoveHistory({
        productId: productId as string,
        warehouseId: warehouseId as string,
        movementType: movementType as any,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getInventoryOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, categoryId, stockStatus, search } = req.query;
      const overview = await LedgerService.getInventoryOverview({
        warehouseId: warehouseId as string,
        categoryId: categoryId as string,
        stockStatus: stockStatus as any,
        search: search as string,
      });

      res.status(200).json({
        success: true,
        data: overview,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
