import { Request, Response, NextFunction } from 'express';
import { OperationsService } from './operations.service';
import { AuthenticatedRequest } from '../../core/middleware/auth-guard';

export class OperationsController {
  // Receipts
  static async listReceipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, warehouseId, search, page, limit } = req.query;
      const result = await OperationsService.listReceipts({
        status: status as string,
        warehouseId: warehouseId as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
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

  static async getReceiptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await OperationsService.getReceiptById(req.params.id);
      res.status(200).json({
        success: true,
        data: receipt,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await OperationsService.createReceipt(req.body);
      res.status(201).json({
        success: true,
        message: 'Receipt created in DRAFT status',
        data: receipt,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateReceiptStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await OperationsService.updateReceiptStatus(req.params.id, req.body.status);
      res.status(200).json({
        success: true,
        message: `Receipt status updated to ${req.body.status}`,
        data: receipt,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async validateReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await OperationsService.validateReceipt(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Receipt successfully validated and inventory balance increased',
        data: receipt,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  // Deliveries
  static async listDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, warehouseId, search, page, limit } = req.query;
      const result = await OperationsService.listDeliveries({
        status: status as string,
        warehouseId: warehouseId as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
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

  static async getDeliveryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const delivery = await OperationsService.getDeliveryById(req.params.id);
      res.status(200).json({
        success: true,
        data: delivery,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const delivery = await OperationsService.createDelivery(req.body);
      res.status(201).json({
        success: true,
        message: 'Delivery order created in DRAFT status',
        data: delivery,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateDeliveryStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const delivery = await OperationsService.updateDeliveryStatus(req.params.id, req.body.status);
      res.status(200).json({
        success: true,
        message: `Delivery order status updated to ${req.body.status}`,
        data: delivery,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async validateDelivery(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const delivery = await OperationsService.validateDelivery(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Delivery order successfully validated and inventory balance dispatched',
        data: delivery,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  // Transfers
  static async listTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, page, limit } = req.query;
      const result = await OperationsService.listTransfers({
        status: status as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
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

  static async getTransferById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await OperationsService.getTransferById(req.params.id);
      res.status(200).json({
        success: true,
        data: transfer,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await OperationsService.createTransfer(req.body);
      res.status(201).json({
        success: true,
        message: 'Transfer created in DRAFT status',
        data: transfer,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTransferStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await OperationsService.updateTransferStatus(req.params.id, req.body.status);
      res.status(200).json({
        success: true,
        message: `Transfer status updated to ${req.body.status}`,
        data: transfer,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async completeTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await OperationsService.completeTransfer(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        message: 'Internal transfer completed successfully with zero company stock delta',
        data: transfer,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  // Adjustments
  static async listAdjustments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, warehouseId, page, limit } = req.query;
      const result = await OperationsService.listAdjustments({
        productId: productId as string,
        warehouseId: warehouseId as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
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

  static async createAdjustment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adjustment = await OperationsService.createAdjustment(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        message: 'Physical stock adjustment executed and recorded into ledger',
        data: adjustment,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  // Suppliers
  static async listSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const suppliers = await OperationsService.listSuppliers();
      res.status(200).json({
        success: true,
        data: suppliers,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await OperationsService.createSupplier(req.body);
      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
