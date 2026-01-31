import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Gold Price API',
    version: '1.0.0',
    description: `
      Backend API for Gold Price Application
      
      ## Features
      - Real-time gold prices from multiple sources
      - Historical price data and analytics
      - User authentication with JWT
      - Price alerts and notifications
      - Portfolio management
      
      ## Authentication
      Most endpoints require authentication. Include the JWT token in the Authorization header:
      \`Authorization: Bearer <your_token>\`
      
      Get your token by registering or logging in at \`/v1/auth/register\` or \`/v1/auth/login\`
    `,
    contact: {
      name: 'API Support',
      email: 'support@goldprice.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: 'https://api.goldprice.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'VALIDATION_ERROR',
              },
              message: {
                type: 'string',
                example: 'Invalid input data',
              },
            },
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-01-29T10:30:00.000Z',
          },
        },
      },
      Price: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          code: {
            type: 'string',
            example: 'SJC',
            description: 'Gold type code',
          },
          name: {
            type: 'string',
            example: 'Vàng SJC 1L',
            description: 'Gold type name',
          },
          buy: {
            type: 'number',
            example: 78500000,
            description: 'Buy price',
          },
          sell: {
            type: 'number',
            example: 79500000,
            description: 'Sell price',
          },
          changeBuy: {
            type: 'number',
            example: 50000,
            description: 'Change in buy price',
          },
          changeSell: {
            type: 'number',
            example: 50000,
            description: 'Change in sell price',
          },
          currency: {
            type: 'string',
            enum: ['VND', 'USD'],
            example: 'VND',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user',
          },
          isPremium: {
            type: 'boolean',
            example: false,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['healthy', 'degraded', 'unhealthy'],
            example: 'healthy',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          uptime: {
            type: 'number',
            description: 'Server uptime in seconds',
            example: 3600,
          },
          services: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['connected', 'disconnected', 'error'],
                  },
                  responseTime: {
                    type: 'number',
                    description: 'Response time in milliseconds',
                  },
                },
              },
              redis: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['connected', 'disconnected', 'error'],
                  },
                  responseTime: {
                    type: 'number',
                  },
                },
              },
            },
          },
          memory: {
            type: 'object',
            properties: {
              used: {
                type: 'number',
                description: 'Used memory in MB',
              },
              total: {
                type: 'number',
                description: 'Total memory in MB',
              },
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status endpoints',
    },
    {
      name: 'Auth',
      description: 'Authentication and user management',
    },
    {
      name: 'Prices',
      description: 'Gold price information and history',
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [
    './src/routes/**/*.ts',
    './src/controllers/**/*.ts',
    './src/models/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
