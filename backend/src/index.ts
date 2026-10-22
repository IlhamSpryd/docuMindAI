import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 DocuMind AI Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`🔗 Health check available at: http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful Shutdown
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
