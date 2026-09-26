import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error';
import { logger } from '../logger/logger';
import { env } from '../../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: formattedErrors,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle known operational application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle unexpected internal server errors
  logger.error(`Unhandled Exception [${req.method} ${req.originalUrl}]:`, {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message,
    },
    timestamp: new Date().toISOString(),
  });
}
