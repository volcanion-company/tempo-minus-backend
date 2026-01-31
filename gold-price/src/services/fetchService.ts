import axios from 'axios';
import { Price, PriceHistory, Provider } from '../models';
import { cacheService } from './cacheService';
import { websocketService, PriceChangeEvent } from './websocketService';
import { CACHE_KEYS } from '../config/constants';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

interface VangTodayPrice {
  name: string;
  buy: number;
  sell: number;
  change_buy: number;
  change_sell: number;
  currency: string;
}

interface VangTodayResponse {
  success: boolean;
  timestamp: number;
  time: string;
  date: string;
  count: number;
  prices: Record<string, VangTodayPrice>;
}

class FetchService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000; // 2 seconds

  async fetchPrices(): Promise<void> {
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        const response = await axios.get<VangTodayResponse>(
          config.externalApi.vangToday,
          {
            timeout: 10000,
          }
        );

        if (!response.data.success) {
          throw new Error('API returned unsuccessful response');
        }

        await this.processPrices(response.data);
        return;
      } catch (error) {
        retries++;
        logger.error(`Fetch prices attempt ${retries} failed:`, error);

        if (retries < this.maxRetries) {
          await this.delay(this.retryDelay * retries); // Exponential backoff
        } else {
          throw new Error(`Failed to fetch prices after ${this.maxRetries} attempts`);
        }
      }
    }
  }

  private async processPrices(data: VangTodayResponse): Promise<void> {
    const { prices, timestamp } = data;
    const recordedAt = new Date(timestamp * 1000);
    const bulkOps: any[] = [];
    const historyDocs: any[] = [];
    const priceChanges: PriceChangeEvent[] = [];

    // Lấy tất cả giá hiện tại từ REDIS CACHE để so sánh (nhanh hơn DB)
    let existingPrices: any[] | null = await cacheService.get(CACHE_KEYS.CURRENT_PRICES);
    
    // Nếu cache chưa có, lấy từ DB và cache lại
    if (!existingPrices) {
      existingPrices = await Price.find().lean().exec();
      if (existingPrices.length > 0) {
        await cacheService.set(CACHE_KEYS.CURRENT_PRICES, existingPrices, 3600);
      }
    }

    const existingPriceMap = new Map(
      existingPrices.map(p => [p.code, p])
    );

    // Lấy danh sách providers từ cache hoặc DB
    let providers: any[] | null = await cacheService.get('providers:all');
    if (!providers) {
      providers = await Provider.find().lean().exec();
      if (providers.length > 0) {
        await cacheService.set('providers:all', providers, 86400); // Cache 24h
      }
    }
    const providerMap = new Map(providers.map(p => [p.code, p.name]));

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const [code, priceData] of Object.entries(prices)) {
      // Validate price data
      if (priceData.buy < 0 || priceData.sell < 0) {
        logger.warn(`Invalid price data for ${code}:`, priceData);
        continue;
      }

      // Lấy giá cũ để kiểm tra thay đổi
      const existingPrice = existingPriceMap.get(code);
      
      // Sử dụng change từ API (so sánh với giá đầu ngày)
      // Đây là giá trị chính xác từ nguồn dữ liệu
      const changeBuy = priceData.change_buy || 0;
      const changeSell = priceData.change_sell || 0;

      // Lấy tên từ Provider collection, fallback về tên từ API
      const providerName = providerMap.get(code) || priceData.name;

      const priceDoc = {
        code,
        name: providerName,
        buy: priceData.buy,
        sell: priceData.sell,
        changeBuy: changeBuy,
        changeSell: changeSell,
        currency: priceData.currency as 'VND' | 'USD',
        source: 'vang.today',
      };

      // Kiểm tra xem giá có thay đổi không (sử dụng existingPrice đã khai báo ở trên)
      const priceChanged = !existingPrice || 
        existingPrice.buy !== priceData.buy || 
        existingPrice.sell !== priceData.sell;

      // Luôn cập nhật current price (để có timestamp mới nhất)
      bulkOps.push({
        updateOne: {
          filter: { code },
          update: { $set: priceDoc },
          upsert: true,
        },
      });

      // Chỉ lưu vào history khi giá thay đổi
      if (priceChanged) {
        historyDocs.push({
          code,
          buy: priceData.buy,
          sell: priceData.sell,
          changeBuy: changeBuy,
          changeSell: changeSell,
          currency: priceData.currency,
          recordedAt,
          period: 'minute',
        });
        
        // Collect changes for WebSocket broadcast
        priceChanges.push({
          code,
          name: providerName,
          buy: priceData.buy,
          sell: priceData.sell,
          changeBuy: changeBuy,
          changeSell: changeSell,
          currency: priceData.currency,
          timestamp: recordedAt,
        });
        
        updatedCount++;
      } else {
        unchangedCount++;
      }
    }

    // Bulk update current prices
    if (bulkOps.length > 0) {
      await Price.bulkWrite(bulkOps);
      
      // Luôn cập nhật cache sau khi bulk update
      // vì changeBuy/changeSell có thể thay đổi dù buy/sell không đổi
      const allPrices = await Price.find().lean().exec();
      await cacheService.set(CACHE_KEYS.CURRENT_PRICES, allPrices, 3600);
      
      // Invalidate related cache
      await cacheService.invalidatePattern('prices:*');
    }

    // Insert history records chỉ khi có thay đổi
    if (historyDocs.length > 0) {
      await PriceHistory.insertMany(historyDocs);
      logger.info(`Saved ${historyDocs.length} price changes to history`);
      
      // Invalidate history cache
      await cacheService.invalidatePattern('history:*');

      // Broadcast price changes via WebSocket
      if (websocketService.isInitialized()) {
        await websocketService.broadcastPriceChanges(priceChanges);
      }
    }

    logger.info(
      `Processed ${bulkOps.length} prices: ${updatedCount} changed, ${unchangedCount} unchanged`
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const fetchService = new FetchService();
