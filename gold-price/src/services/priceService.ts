import { Price, PriceHistory } from '../models';
import { cacheService } from './cacheService';
import { CACHE_KEYS, TTL } from '../config/constants';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

class PriceService {
  async getCurrentPrices(currency?: 'VND' | 'USD') {
    try {
      // Try cache first
      const cacheKey = currency
        ? `${CACHE_KEYS.CURRENT_PRICES}:${currency}`
        : CACHE_KEYS.CURRENT_PRICES;
      
      const cached = await cacheService.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Cache miss - fetch from database
      const query = currency ? { currency } : {};
      const prices = await Price.find(query).lean().exec();

      // Store in cache
      await cacheService.set(cacheKey, prices, TTL.CURRENT_PRICES);

      return prices;
    } catch (error) {
      logger.error('Get current prices error:', error);
      throw error;
    }
  }

  async getPriceByCode(code: string) {
    try {
      // Try cache first
      const cacheKey = CACHE_KEYS.PRICE_BY_CODE(code);
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Cache miss - fetch from database
      const price = await Price.findOne({ code: code.toUpperCase() }).lean().exec();
      if (!price) {
        throw new NotFoundError(`Price with code ${code} not found`);
      }

      // Store in cache
      await cacheService.set(cacheKey, price, TTL.SINGLE_PRICE);

      return price;
    } catch (error) {
      logger.error('Get price by code error:', { code, error });
      throw error;
    }
  }

  async getPriceHistory(
    code: string,
    period: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day',
    from?: Date,
    to?: Date,
    limit: number = 100
  ) {
    try {
      const query: any = {
        code: code.toUpperCase(),
        // Note: Don't filter by period since fetchService saves all as 'minute'
        // We may aggregate by period in the future
      };

      if (from || to) {
        query.recordedAt = {};
        if (from) query.recordedAt.$gte = from;
        if (to) query.recordedAt.$lte = to;
      }

      const history = await PriceHistory.find(query)
        .sort({ recordedAt: -1 })
        .limit(limit)
        .lean()
        .exec();

      return history;
    } catch (error) {
      logger.error('Get price history error:', { code, period, error });
      throw error;
    }
  }

  async comparePrices(codes?: string[]) {
    try {
      const prices = await this.getCurrentPrices();
      
      let filteredPrices = prices;
      if (codes && codes.length > 0) {
        const upperCodes = codes.map(c => c.toUpperCase());
        filteredPrices = prices.filter(p => upperCodes.includes(p.code));
      }

      // Find best buy and sell prices
      const vndPrices = filteredPrices.filter(p => p.currency === 'VND');
      
      const bestBuy = vndPrices.reduce((min, p) => 
        !min || p.buy < min.buy ? p : min, null as any
      );
      
      const bestSell = vndPrices.reduce((max, p) => 
        !max || p.sell > max.sell ? p : max, null as any
      );

      return {
        prices: filteredPrices,
        bestBuy: bestBuy ? { code: bestBuy.code, name: bestBuy.name, price: bestBuy.buy } : null,
        bestSell: bestSell ? { code: bestSell.code, name: bestSell.name, price: bestSell.sell } : null,
      };
    } catch (error) {
      logger.error('Compare prices error:', error);
      throw error;
    }
  }

  async getStatistics(code: string, days: number = 30) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const history = await PriceHistory.find({
        code: code.toUpperCase(),
        period: 'day',
        recordedAt: { $gte: fromDate },
      })
        .sort({ recordedAt: 1 })
        .lean()
        .exec();

      if (history.length === 0) {
        return null;
      }

      const buyPrices = history.map(h => h.buy);
      const sellPrices = history.map(h => h.sell);

      return {
        period: `${days} days`,
        count: history.length,
        buy: {
          min: Math.min(...buyPrices),
          max: Math.max(...buyPrices),
          avg: buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length,
          current: buyPrices[buyPrices.length - 1],
          change: buyPrices[buyPrices.length - 1] - buyPrices[0],
        },
        sell: {
          min: Math.min(...sellPrices),
          max: Math.max(...sellPrices),
          avg: sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length,
          current: sellPrices[sellPrices.length - 1],
          change: sellPrices[sellPrices.length - 1] - sellPrices[0],
        },
      };
    } catch (error) {
      logger.error('Get statistics error:', { code, days, error });
      throw error;
    }
  }

  /**
   * Seed sample history data for testing
   */
  async seedHistoryData(days: number = 30) {
    try {
      // Get current prices as base
      const currentPrices = await Price.find().lean().exec();
      
      if (currentPrices.length === 0) {
        logger.warn('No current prices found, cannot seed history');
        return 0;
      }

      const historyDocs: any[] = [];
      const now = new Date();

      for (const price of currentPrices) {
        let currentBuy = price.buy;
        let currentSell = price.sell;
        
        // Generate data for each day going back
        for (let i = days; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(9, 0, 0, 0); // Set to 9 AM
          
          // Random fluctuation: -2% to +2%
          const fluctuation = (Math.random() - 0.5) * 0.04;
          const prevBuy = currentBuy;
          const prevSell = currentSell;
          
          if (i > 0) {
            // Apply small random change for historical data
            currentBuy = Math.round(price.buy * (1 + fluctuation * ((days - i) / days)));
            currentSell = Math.round(price.sell * (1 + fluctuation * ((days - i) / days)));
          } else {
            // Last day = current price
            currentBuy = price.buy;
            currentSell = price.sell;
          }

          historyDocs.push({
            code: price.code,
            buy: currentBuy,
            sell: currentSell,
            changeBuy: currentBuy - prevBuy,
            changeSell: currentSell - prevSell,
            currency: price.currency,
            recordedAt: date,
            period: 'minute', // Using minute as that's what fetchService uses
          });
        }
      }

      // Clear existing history and insert new
      await PriceHistory.deleteMany({});
      await PriceHistory.insertMany(historyDocs);

      logger.info(`Seeded ${historyDocs.length} history records`);
      return historyDocs.length;
    } catch (error) {
      logger.error('Seed history error:', error);
      throw error;
    }
  }
}

export const priceService = new PriceService();
