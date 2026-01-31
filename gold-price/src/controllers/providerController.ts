import { Request, Response, NextFunction } from 'express';
import { providerService } from '../services';

class ProviderController {
  /**
   * @swagger
   * /v1/providers:
   *   get:
   *     summary: Get all gold providers
   *     description: Retrieve list of gold providers with their display names
   *     tags: [Providers]
   *     responses:
   *       200:
   *         description: Providers retrieved successfully
   */
  async getAllProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const providers = await providerService.getAllProviders();

      res.json({
        success: true,
        data: {
          count: providers.length,
          providers,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/providers/{code}:
   *   get:
   *     summary: Get provider by code
   *     description: Retrieve a specific provider by its code
   *     tags: [Providers]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Provider found
   *       404:
   *         description: Provider not found
   */
  async getByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const provider = await providerService.getByCode(code);

      if (!provider) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Provider with code ${code} not found`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        data: provider,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /v1/providers:
   *   post:
   *     summary: Create or update a provider
   *     description: Upsert a provider with code and display name
   *     tags: [Providers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *               - name
   *             properties:
   *               code:
   *                 type: string
   *               name:
   *                 type: string
   *     responses:
   *       200:
   *         description: Provider created/updated successfully
   */
  async upsertProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name } = req.body;

      if (!code || !name) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'code and name are required',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const provider = await providerService.upsertProvider(code, name);

      return res.json({
        success: true,
        data: provider,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /v1/providers/bulk:
   *   post:
   *     summary: Bulk create or update providers
   *     description: Upsert multiple providers at once
   *     tags: [Providers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - providers
   *             properties:
   *               providers:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                     name:
   *                       type: string
   *     responses:
   *       200:
   *         description: Providers created/updated successfully
   */
  async bulkUpsertProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const { providers } = req.body;

      if (!Array.isArray(providers) || providers.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'providers array is required and must not be empty',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const result = await providerService.bulkUpsertProviders(providers);

      return res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /v1/providers/{code}:
   *   delete:
   *     summary: Delete a provider
   *     description: Remove a provider by its code
   *     tags: [Providers]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Provider deleted successfully
   */
  async deleteProvider(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const result = await providerService.deleteProvider(code);

      res.json({
        success: true,
        data: {
          deleted: result.deletedCount > 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const providerController = new ProviderController();
