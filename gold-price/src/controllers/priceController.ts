import { Request, Response, NextFunction } from 'express';
import { priceService, fetchService } from '../services';

class PriceController {
  /**
   * @swagger
   * /v1/prices/codes:
   *   get:
   *     summary: Get list of all gold codes
   *     description: Retrieve list of all available gold type codes and names
   *     tags: [Prices]
   *     responses:
   *       200:
   *         description: Gold codes retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     count:
   *                       type: number
   *                       example: 12
   *                     codes:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           code:
   *                             type: string
   *                             example: SJL1L10
   *                           name:
   *                             type: string
   *                             example: SJC 9999
   *                           currency:
   *                             type: string
   *                             example: VND
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async getGoldCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const prices = await priceService.getCurrentPrices();
      const codes = prices.map((p: any) => ({
        code: p.code,
        name: p.name,
        currency: p.currency,
      }));

      res.json({
        success: true,
        data: {
          count: codes.length,
          codes,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/prices:
   *   get:
   *     summary: Get all current gold prices
   *     description: Retrieve current prices for all gold types
   *     tags: [Prices]
   *     parameters:
   *       - in: query
   *         name: currency
   *         schema:
   *           type: string
   *           enum: [VND, USD]
   *         description: Filter by currency
   *     responses:
   *       200:
   *         description: Prices retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     count:
   *                       type: number
   *                       example: 10
   *                     prices:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Price'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   */
  async getCurrentPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const { currency } = req.query;
      const prices = await priceService.getCurrentPrices(
        currency as 'VND' | 'USD' | undefined
      );

      res.json({
        success: true,
        data: {
          count: prices.length,
          prices,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/prices/{code}:
   *   get:
   *     summary: Get price by code
   *     description: Get current price for a specific gold type
   *     tags: [Prices]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Gold type code (e.g., SJC, PNJ)
   *         example: SJC
   *     responses:
   *       200:
   *         description: Price retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Price'
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *       404:
   *         description: Price not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getPriceByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const price = await priceService.getPriceByCode(code);

      res.json({
        success: true,
        data: price,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/prices/{code}/history:
   *   get:
   *     summary: Get price history
   *     description: Get historical price data for a specific gold type
   *     tags: [Prices]
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Gold type code
   *         example: SJC
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [minute, hour, day, week, month]
   *           default: day
   *         description: Time period granularity
   *       - in: query
   *         name: from
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Start date (ISO 8601)
   *       - in: query
   *         name: to
   *         schema:
   *           type: string
   *           format: date-time
   *         description: End date (ISO 8601)
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *           maximum: 1000
   *         description: Maximum number of records
   *     responses:
   *       200:
   *         description: History retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                     period:
   *                       type: string
   *                     count:
   *                       type: number
   *                     history:
   *                       type: array
   *                       items:
   *                         type: object
   */
  async getPriceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { period = 'day', from, to, limit = '100' } = req.query;

      const history = await priceService.getPriceHistory(
        code,
        period as any,
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined,
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: {
          code,
          period,
          count: history.length,
          history,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async comparePrices(req: Request, res: Response, next: NextFunction) {
    try {
      const { codes } = req.query;
      const codeArray = codes ? (codes as string).split(',') : undefined;

      const comparison = await priceService.comparePrices(codeArray);

      res.json({
        success: true,
        data: comparison,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { days = '30' } = req.query;

      const statistics = await priceService.getStatistics(
        code,
        parseInt(days as string, 10)
      );

      res.json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/prices/refresh:
   *   post:
   *     summary: Manually refresh prices
   *     description: Trigger a manual price refresh from external source
   *     tags: [Prices]
   *     responses:
   *       200:
   *         description: Prices refreshed successfully
   */
  async refreshPrices(req: Request, res: Response, next: NextFunction) {
    try {
      await fetchService.fetchPrices();

      res.json({
        success: true,
        message: 'Prices refreshed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/prices/seed-history:
   *   post:
   *     summary: Seed sample history data (dev only)
   *     description: Generate sample history data for testing
   *     tags: [Prices]
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Number of days of history to generate
   *     responses:
   *       200:
   *         description: History seeded successfully
   */
  async seedHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { days = '30' } = req.query;
      const numDays = parseInt(days as string, 10);
      
      const count = await priceService.seedHistoryData(numDays);

      res.json({
        success: true,
        message: `Seeded ${count} history records for ${numDays} days`,
        data: { recordCount: count, days: numDays },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const priceController = new PriceController();
