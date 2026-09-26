import { z } from 'zod';

export const createReceiptSchema = z.object({
  supplierId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('Valid Product ID is required'),
      binId: z.string().uuid('Valid Location Bin ID is required'),
      quantityReceived: z.number().positive('Received quantity must be greater than 0'),
    })
  ).min(1, 'Receipt must contain at least one item'),
});

export const updateReceiptStatusSchema = z.object({
  status: z.enum(['WAITING', 'READY', 'CANCELLED']),
});

export const createDeliveryOrderSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(150),
  warehouseId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('Valid Product ID is required'),
      binId: z.string().uuid('Valid Location Bin ID is required'),
      quantityDemanded: z.number().positive('Demanded quantity must be greater than 0'),
    })
  ).min(1, 'Delivery order must contain at least one item'),
});

export const updateDeliveryOrderStatusSchema = z.object({
  status: z.enum(['WAITING', 'READY', 'PICKING', 'PACKED', 'CANCELLED']),
});

export const createTransferSchema = z.object({
  sourceWarehouseId: z.string().uuid().optional(),
  destWarehouseId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid('Valid Product ID is required'),
      sourceBinId: z.string().uuid('Valid source bin ID is required'),
      destBinId: z.string().uuid('Valid destination bin ID is required'),
      quantity: z.number().positive('Transfer quantity must be greater than 0'),
    })
  ).min(1, 'Transfer must contain at least one item'),
});

export const updateTransferStatusSchema = z.object({
  status: z.enum(['WAITING', 'READY', 'IN_TRANSIT', 'CANCELLED']),
});

export const createAdjustmentSchema = z.object({
  productId: z.string().uuid('Valid Product ID is required'),
  binId: z.string().uuid('Valid Location Bin ID is required'),
  countedQty: z.number().min(0, 'Physical counted quantity cannot be negative'),
  reasonCode: z.enum(['DAMAGED', 'LOST', 'FOUND', 'COUNTING_ERROR', 'DATA_CORRECTION', 'OTHER']),
  notes: z.string().max(500).optional(),
});

export const createSupplierSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(2).max(150),
  contactEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(250).optional(),
  leadTimeDays: z.number().int().min(1).default(7),
});
