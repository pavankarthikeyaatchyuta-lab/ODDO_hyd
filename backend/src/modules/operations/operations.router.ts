import { Router } from 'express';
import { OperationsController } from './operations.controller';
import { authenticate, requirePermission } from '../../core/middleware/auth-guard';
import { validateBody } from '../../core/middleware/validate';
import {
  createReceiptSchema,
  updateReceiptStatusSchema,
  createDeliveryOrderSchema,
  updateDeliveryOrderStatusSchema,
  createTransferSchema,
  updateTransferStatusSchema,
  createAdjustmentSchema,
  createSupplierSchema,
} from './operations.schema';

export const operationsRouter = Router();

// Authentication required on all operations endpoints
operationsRouter.use(authenticate);

// 1. Receipts
operationsRouter.get('/receipts', OperationsController.listReceipts);
operationsRouter.get('/receipts/:id', OperationsController.getReceiptById);
operationsRouter.post(
  '/receipts',
  requirePermission('stock:receive'),
  validateBody(createReceiptSchema),
  OperationsController.createReceipt
);
operationsRouter.patch(
  '/receipts/:id/status',
  requirePermission('stock:receive'),
  validateBody(updateReceiptStatusSchema),
  OperationsController.updateReceiptStatus
);
operationsRouter.post(
  '/receipts/:id/validate',
  requirePermission('stock:receive'),
  OperationsController.validateReceipt
);

// 2. Deliveries
operationsRouter.get('/deliveries', OperationsController.listDeliveries);
operationsRouter.get('/deliveries/:id', OperationsController.getDeliveryById);
operationsRouter.post(
  '/deliveries',
  requirePermission('stock:deliver'),
  validateBody(createDeliveryOrderSchema),
  OperationsController.createDelivery
);
operationsRouter.patch(
  '/deliveries/:id/status',
  requirePermission('stock:deliver'),
  validateBody(updateDeliveryOrderStatusSchema),
  OperationsController.updateDeliveryStatus
);
operationsRouter.post(
  '/deliveries/:id/validate',
  requirePermission('stock:deliver'),
  OperationsController.validateDelivery
);

// 3. Transfers
operationsRouter.get('/transfers', OperationsController.listTransfers);
operationsRouter.get('/transfers/:id', OperationsController.getTransferById);
operationsRouter.post(
  '/transfers',
  requirePermission('stock:transfer'),
  validateBody(createTransferSchema),
  OperationsController.createTransfer
);
operationsRouter.patch(
  '/transfers/:id/status',
  requirePermission('stock:transfer'),
  validateBody(updateTransferStatusSchema),
  OperationsController.updateTransferStatus
);
operationsRouter.post(
  '/transfers/:id/complete',
  requirePermission('stock:transfer'),
  OperationsController.completeTransfer
);

// 4. Adjustments
operationsRouter.get('/adjustments', OperationsController.listAdjustments);
operationsRouter.post(
  '/adjustments',
  requirePermission('stock:adjust'),
  validateBody(createAdjustmentSchema),
  OperationsController.createAdjustment
);

// 5. Suppliers
operationsRouter.get('/suppliers', OperationsController.listSuppliers);
operationsRouter.post(
  '/suppliers',
  requirePermission('products:create_update'),
  validateBody(createSupplierSchema),
  OperationsController.createSupplier
);
