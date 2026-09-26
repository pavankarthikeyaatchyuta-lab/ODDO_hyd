import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './core/middleware/request-logger';
import { errorHandler } from './core/errors/error-handler';
import { NotFoundError } from './core/errors/app-error';
import { healthRouter } from './modules/health/health.router';
import { authRouter } from './modules/auth/auth.router';
import { sensitiveRouter } from './modules/sensitive/sensitive.router';
import { productsRouter, categoriesRouter } from './modules/products/products.router';
import { warehousesRouter } from './modules/warehouses/warehouses.router';
import { operationsRouter } from './modules/operations/operations.router';
import { ledgerRouter } from './modules/ledger/ledger.router';
import { dashboardRouter } from './modules/dashboard/dashboard.router';
import { notificationsRouter } from './modules/notifications/notifications.router';

export function createApp(): Express {
  const app = express();

  // 1. Security & Ingress Headers
  app.use(helmet());
  app.use(
    cors({
      origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-warehouse-id'],
    })
  );

  // 2. Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Request Logging
  app.use(requestLogger);

  // 4. API Domain Routes
  app.use(`${env.API_PREFIX}/health`, healthRouter);
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/products`, productsRouter);
  app.use(`${env.API_PREFIX}/categories`, categoriesRouter);
  app.use(`${env.API_PREFIX}/warehouses`, warehousesRouter);
  app.use(`${env.API_PREFIX}/operations`, operationsRouter);
  app.use(`${env.API_PREFIX}/inventory`, ledgerRouter);
  app.use(`${env.API_PREFIX}/dashboard`, dashboardRouter);
  app.use(`${env.API_PREFIX}/notifications`, notificationsRouter);
  app.use(`${env.API_PREFIX}/sensitive`, sensitiveRouter);

  // 5. Unhandled Route Catch-all (404)
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(`Resource not found on endpoint: [${req.method} ${req.originalUrl}]`));
  });

  // 6. Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
