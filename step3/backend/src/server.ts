import { createApp } from './app';
import { env } from './config/env';
import { logger } from './core/logger/logger';
import { prisma, checkDatabaseConnection } from './core/database/prisma';

async function bootstrap() {
  const app = createApp();

  // Test database connection on startup
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    logger.info(`✅ Database connected successfully (${dbHealth.responseTimeMs}ms)`);
  } else {
    logger.error('❌ Database connection failed at startup');
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 StockSense Backend API listening on http://localhost:${env.PORT}`);
    logger.info(`📡 Health Endpoint: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    logger.info(`🔐 Auth Base: http://localhost:${env.PORT}${env.API_PREFIX}/auth`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Database disconnected. Process exited.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});
