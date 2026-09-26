import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(2, 'SKU must be at least 2 characters').max(50),
  name: z.string().min(2, 'Product name must be at least 2 characters').max(150),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid('Valid Category ID is required'),
  uom: z.string().default('PCS'),
  costPrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
  minStock: z.number().min(0).default(10),
  maxStock: z.number().min(0).default(100),
  reorderQuantity: z.number().min(0).default(20),
  isActive: z.boolean().default(true),
  initialStock: z.number().min(0).optional(),
  initialBinId: z.string().uuid().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  uom: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  code: z.string().min(2, 'Category code must be at least 2 characters').max(50),
  description: z.string().max(300).optional(),
});
