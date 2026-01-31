import { createApp } from './app';
import { connectDatabase } from './config/database';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { initializeJobs } from './jobs';
import { websocketService } from './services/websocketService';
import { createServer } from 'http';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket
    websocketService.initialize(httpServer);

    // Initialize background jobs (includes initial price fetch)
    await initializeJobs();

    // Start server - bind to host (0.0.0.0) to allow external connections
    httpServer.listen(config.port, config.host, () => {
      logger.info(`Server running on ${config.host}:${config.port} in ${config.env} mode`);
      logger.info(`API version: ${config.apiVersion}`);
      logger.info(`WebSocket server ready for connections`);
      
      // Log network interfaces for easy access from mobile devices
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      logger.info('Available on:');
      Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName]?.forEach((iface: any) => {
          if (iface.family === 'IPv4' && !iface.internal) {
            logger.info(`  http://${iface.address}:${config.port}`);
            logger.info(`  WebSocket: ws://${iface.address}:${config.port}`);
          }
        });
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
