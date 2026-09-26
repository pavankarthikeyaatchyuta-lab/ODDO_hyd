import { PrismaClient } from '@prisma/client';
import { logger } from '../logger/logger';

declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined;
}

export const prisma =
  global.prismaInstance ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaInstance = prisma;
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; responseTimeMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTimeMs = Date.now() - start;
    return { connected: true, responseTimeMs };
  } catch (error) {
    logger.error('Database connection check failed', error);
    return { connected: false, responseTimeMs: Date.now() - start };
  }
}
