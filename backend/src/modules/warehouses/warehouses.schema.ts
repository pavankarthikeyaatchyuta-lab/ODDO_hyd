import { z } from 'zod';

export const createWarehouseSchema = z.object({
  code: z.string().min(2, 'Warehouse code must be at least 2 characters').max(20),
  name: z.string().min(2, 'Warehouse name must be at least 2 characters').max(100),
  address: z.string().max(250).optional(),
  isActive: z.boolean().default(true),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(250).optional(),
  isActive: z.boolean().optional(),
});

export const createZoneSchema = z.object({
  warehouseId: z.string().uuid('Valid warehouse ID is required'),
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(100),
});

export const createRackSchema = z.object({
  zoneId: z.string().uuid('Valid zone ID is required'),
  code: z.string().min(1).max(20),
  aisleNumber: z.string().max(20).optional(),
});

export const createShelfSchema = z.object({
  rackId: z.string().uuid('Valid rack ID is required'),
  code: z.string().min(1).max(20),
  levelNumber: z.number().int().optional(),
});

export const createBinSchema = z.object({
  shelfId: z.string().uuid('Valid shelf ID is required'),
  code: z.string().min(1).max(20),
  barcode: z.string().min(2).max(50),
});
