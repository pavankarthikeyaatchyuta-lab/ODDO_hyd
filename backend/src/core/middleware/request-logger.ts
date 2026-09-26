import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logMethod = statusCode >= 500 ? logger.error : statusCode >= 400 ? logger.warn : logger.info;
    logMethod(`${method} ${originalUrl} ${statusCode} - ${duration}ms [${ip}]`);
  });

  next();
}
