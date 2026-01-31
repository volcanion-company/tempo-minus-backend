import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/environment';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import v1Routes from './routes/v1';

export function createApp(): Application {
  const app = express();

  // Security middleware - Apply first but disable crossOriginResourcePolicy
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      contentSecurityPolicy: config.env === 'production' ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      } : false,
    })
  );

  // CORS - allow all origins (must be after helmet)
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      credentials: true,
    })
  );

  // Handle preflight requests explicitly
  app.options('*', cors());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (config.env !== 'test') {
    app.use(morgan('combined'));
  }

  // Swagger Documentation - without CSP restrictions
  const swaggerUiOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Gold Price API Documentation',
  };
  // @ts-ignore - swagger-ui-express types issue
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Swagger JSON endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API routes
  app.use(`/${config.apiVersion}`, v1Routes);

  // Root route
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.get('/', (req, res) => {
    const host = req.hostname || 'localhost';
    res.json({
      success: true,
      data: {
        message: 'Gold Price API',
        version: config.apiVersion,
        environment: config.env,
        documentation: `http://${host}:${config.port}/api-docs`,
        health: `http://${host}:${config.port}/v1/health`,
        websocket: `ws://${host}:${config.port}`,
      },
    });
  });

  // 404 handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
