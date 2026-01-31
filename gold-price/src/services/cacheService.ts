import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, data);
      } else {
        await redisClient.set(key, data);
      }
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error('Cache invalidate error:', { pattern, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const value = await redisClient.incr(key);
      if (ttlSeconds && value === 1) {
        await redisClient.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      logger.error('Cache increment error:', { key, error });
      return 0;
    }
  }
}

export const cacheService = new CacheService();
