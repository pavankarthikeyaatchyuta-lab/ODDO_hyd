import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticate, requirePermission } from '../../core/middleware/auth-guard';
import { validateBody } from '../../core/middleware/validate';
import { createProductSchema, updateProductSchema, createCategorySchema } from './products.schema';

export const productsRouter = Router();

// All product routes require valid authentication
productsRouter.use(authenticate);

// Product CRUD
productsRouter.get('/', ProductsController.listProducts);
productsRouter.get('/:id', ProductsController.getProductById);
productsRouter.post(
  '/',
  requirePermission('products:create_update'),
  validateBody(createProductSchema),
  ProductsController.createProduct
);
productsRouter.put(
  '/:id',
  requirePermission('products:create_update'),
  validateBody(updateProductSchema),
  ProductsController.updateProduct
);
productsRouter.delete(
  '/:id',
  requirePermission('products:delete'),
  ProductsController.deleteProduct
);

// Categories
export const categoriesRouter = Router();
categoriesRouter.use(authenticate);
categoriesRouter.get('/', ProductsController.listCategories);
categoriesRouter.post(
  '/',
  requirePermission('products:create_update'),
  validateBody(createCategorySchema),
  ProductsController.createCategory
);
