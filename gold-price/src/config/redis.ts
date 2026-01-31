import Redis from 'ioredis';
import { config } from './environment';
import { logger } from '../utils/logger';

class RedisClient {
  private client: Redis;
  private static instance: RedisClient;

  private constructor() {
    this.client = new Redis(config.redis.url);

    this.client.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
    });

    process.on('SIGINT', async () => {
      await this.client.quit();
      logger.info('Redis connection closed due to app termination');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.client;
  }
}

export { RedisClient };
export const redisClient = RedisClient.getInstance().getClient();
