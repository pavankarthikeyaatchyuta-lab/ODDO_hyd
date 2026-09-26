import { Router } from 'express';
import { WarehousesController } from './warehouses.controller';
import { authenticate, requirePermission } from '../../core/middleware/auth-guard';
import { validateBody } from '../../core/middleware/validate';
import { 
  createWarehouseSchema, 
  updateWarehouseSchema, 
  createZoneSchema, 
  createRackSchema, 
  createShelfSchema, 
  createBinSchema 
} from './warehouses.schema';

export const warehousesRouter = Router();

// Authentication required for all warehouse endpoints
warehousesRouter.use(authenticate);

// Quick bin lookup for dropdowns & barcode lookups
warehousesRouter.get('/bins', WarehousesController.getAllBins);

// Warehouse CRUD
warehousesRouter.get('/', WarehousesController.listWarehouses);
warehousesRouter.get('/:id', WarehousesController.getWarehouseHierarchy);
warehousesRouter.post(
  '/',
  requirePermission('warehouses:manage'),
  validateBody(createWarehouseSchema),
  WarehousesController.createWarehouse
);
warehousesRouter.put(
  '/:id',
  requirePermission('warehouses:manage'),
  validateBody(updateWarehouseSchema),
  WarehousesController.updateWarehouse
);

// Hierarchy building endpoints
warehousesRouter.post(
  '/:id/zones',
  requirePermission('warehouses:manage'),
  validateBody(createZoneSchema.omit({ warehouseId: true })),
  WarehousesController.createZone
);
warehousesRouter.post(
  '/zones/:id/racks',
  requirePermission('warehouses:manage'),
  validateBody(createRackSchema.omit({ zoneId: true })),
  WarehousesController.createRack
);
warehousesRouter.post(
  '/racks/:id/shelves',
  requirePermission('warehouses:manage'),
  validateBody(createShelfSchema.omit({ rackId: true })),
  WarehousesController.createShelf
);
warehousesRouter.post(
  '/shelves/:id/bins',
  requirePermission('warehouses:manage'),
  validateBody(createBinSchema.omit({ shelfId: true })),
  WarehousesController.createBin
);
