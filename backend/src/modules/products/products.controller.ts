import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service';
import { AuthenticatedRequest } from '../../core/middleware/auth-guard';

export class ProductsController {
  static async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, categoryId, stockStatus, sortBy, sortOrder } = req.query;
      const result = await ProductsService.listProducts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        categoryId: categoryId as string,
        stockStatus: stockStatus as any,
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

  static async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductsService.getProductById(req.params.id);
      res.status(200).json({
        success: true,
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductsService.createProduct(req.body, req.user?.id);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductsService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProductsService.deleteProduct(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Product deleted/archived successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await ProductsService.listCategories();
      res.status(200).json({
        success: true,
        data: categories,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await ProductsService.createCategory(req.body);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
