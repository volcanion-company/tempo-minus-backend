import { Request, Response, NextFunction } from 'express';
import { healthCheckService } from '../services/healthCheckService';

class HealthController {
  /**
   * @swagger
   * /v1/health:
   *   get:
   *     summary: Get detailed health status
   *     description: Returns detailed health information including database, redis, and memory status
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Health status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/HealthCheck'
   *       503:
   *         description: Service unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await healthCheckService.checkHealth();

      // Return 503 if unhealthy
      const statusCode = health.status === 'unhealthy' ? 503 : 200;

      res.status(statusCode).json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/health/live:
   *   get:
   *     summary: Liveness probe
   *     description: Simple endpoint to check if the service is alive (for Kubernetes/Docker)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is alive
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: alive
   */
  async getLiveness(req: Request, res: Response, next: NextFunction) {
    try {
      const isAlive = await healthCheckService.isAlive();

      res.json({
        status: isAlive ? 'alive' : 'dead',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/health/ready:
   *   get:
   *     summary: Readiness probe
   *     description: Check if the service is ready to accept traffic (database and redis connected)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is ready
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ready
   *       503:
   *         description: Service not ready
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: not ready
   */
  async getReadiness(req: Request, res: Response, next: NextFunction) {
    try {
      const isReady = await healthCheckService.isReady();
      const statusCode = isReady ? 200 : 503;

      res.status(statusCode).json({
        status: isReady ? 'ready' : 'not ready',
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
      });
    }
  }
}

export const healthController = new HealthController();
