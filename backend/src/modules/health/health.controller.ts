import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../../core/database/prisma';
import { env } from '../../config/env';

const startTime = Date.now();

export async function getHealth(req: Request, res: Response): Promise<void> {
  const dbHealth = await checkDatabaseConnection();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const isHealthy = dbHealth.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    environment: env.NODE_ENV,
    version: '0.1.0-dev',
    database: {
      connected: dbHealth.connected,
      provider: 'sqlite',
      responseTimeMs: dbHealth.responseTimeMs,
    },
    services: {
      auth: 'operational',
      ledger: 'operational',
      forecasting: 'operational',
    },
  });
}
