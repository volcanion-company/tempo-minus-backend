import { Provider } from '../models';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';

const CACHE_KEY = 'providers:all';
const CACHE_TTL = 86400; // 24 hours

class ProviderService {
  /**
   * Lấy tất cả providers từ cache hoặc DB
   */
  async getAllProviders() {
    try {
      // Try cache first
      const cached = await cacheService.get<any[]>(CACHE_KEY);
      if (cached) {
        return cached;
      }

      // Cache miss - fetch from database
      const providers = await Provider.find().lean().exec();

      // Store in cache
      if (providers.length > 0) {
        await cacheService.set(CACHE_KEY, providers, CACHE_TTL);
      }

      return providers;
    } catch (error) {
      logger.error('Get all providers error:', error);
      throw error;
    }
  }

  /**
   * Lấy provider theo code
   */
  async getByCode(code: string) {
    try {
      const providers = await this.getAllProviders();
      return providers.find((p: any) => p.code === code.toUpperCase());
    } catch (error) {
      logger.error('Get provider by code error:', { code, error });
      throw error;
    }
  }

  /**
   * Tạo hoặc cập nhật provider
   */
  async upsertProvider(code: string, name: string) {
    try {
      const provider = await Provider.findOneAndUpdate(
        { code: code.toUpperCase() },
        { code: code.toUpperCase(), name },
        { upsert: true, new: true }
      ).lean().exec();

      // Invalidate cache
      await cacheService.delete(CACHE_KEY);

      return provider;
    } catch (error) {
      logger.error('Upsert provider error:', { code, name, error });
      throw error;
    }
  }

  /**
   * Bulk upsert providers
   */
  async bulkUpsertProviders(providers: Array<{ code: string; name: string }>) {
    try {
      const bulkOps = providers.map((p) => ({
        updateOne: {
          filter: { code: p.code.toUpperCase() },
          update: { $set: { code: p.code.toUpperCase(), name: p.name } },
          upsert: true,
        },
      }));

      const result = await Provider.bulkWrite(bulkOps);

      // Invalidate cache
      await cacheService.delete(CACHE_KEY);

      logger.info(`Bulk upsert ${providers.length} providers`);
      return result;
    } catch (error) {
      logger.error('Bulk upsert providers error:', error);
      throw error;
    }
  }

  /**
   * Xóa provider
   */
  async deleteProvider(code: string) {
    try {
      const result = await Provider.deleteOne({ code: code.toUpperCase() });

      // Invalidate cache
      await cacheService.delete(CACHE_KEY);

      return result;
    } catch (error) {
      logger.error('Delete provider error:', { code, error });
      throw error;
    }
  }

  /**
   * Lấy map code -> name để dùng nhanh
   */
  async getProviderMap(): Promise<Map<string, string>> {
    const providers = await this.getAllProviders();
    return new Map(providers.map((p: any) => [p.code, p.name]));
  }
}

export const providerService = new ProviderService();
