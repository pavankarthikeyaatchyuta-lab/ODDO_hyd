import { Request, Response, NextFunction } from 'express';
import { WarehousesService } from './warehouses.service';

export class WarehousesController {
  static async listWarehouses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouses = await WarehousesService.listWarehouses();
      res.status(200).json({
        success: true,
        data: warehouses,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWarehouseHierarchy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hierarchy = await WarehousesService.getWarehouseHierarchy(req.params.id);
      res.status(200).json({
        success: true,
        data: hierarchy,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await WarehousesService.createWarehouse(req.body);
      res.status(201).json({
        success: true,
        message: 'Warehouse created successfully',
        data: warehouse,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateWarehouse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await WarehousesService.updateWarehouse(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Warehouse updated successfully',
        data: warehouse,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAllBins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouseId = req.query.warehouseId as string | undefined;
      const bins = await WarehousesService.getAllBins(warehouseId);
      res.status(200).json({
        success: true,
        data: bins,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createZone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const zone = await WarehousesService.createZone({ ...req.body, warehouseId: req.params.id });
      res.status(201).json({
        success: true,
        message: 'Zone created successfully',
        data: zone,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createRack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rack = await WarehousesService.createRack({ ...req.body, zoneId: req.params.id });
      res.status(201).json({
        success: true,
        message: 'Rack created successfully',
        data: rack,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createShelf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shelf = await WarehousesService.createShelf({ ...req.body, rackId: req.params.id });
      res.status(201).json({
        success: true,
        message: 'Shelf created successfully',
        data: shelf,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bin = await WarehousesService.createBin({ ...req.body, shelfId: req.params.id });
      res.status(201).json({
        success: true,
        message: 'Bin created successfully',
        data: bin,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
