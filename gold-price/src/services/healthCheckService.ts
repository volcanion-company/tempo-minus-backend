import mongoose from 'mongoose';
import { RedisClient } from '../config/redis';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const memoryInfo = this.getMemoryInfo();

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (
      dbStatus.status === 'error' || 
      redisStatus.status === 'error'
    ) {
      overallStatus = 'unhealthy';
    } else if (
      dbStatus.status === 'disconnected' || 
      redisStatus.status === 'disconnected'
    ) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      memory: memoryInfo,
    };
  }

  private async checkDatabase(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
  }> {
    try {
      const startTime = Date.now();
      
      // Check connection state
      const state = mongoose.connection.readyState;
      
      // Perform a simple ping operation
      if (state === 1) {
        const db = mongoose.connection.db;
        if (db) {
          await db.admin().ping();
          const responseTime = Date.now() - startTime;
          
          return {
            status: 'connected',
            responseTime,
          };
        }
      }
      
      return {
        status: 'disconnected',
      };
    } catch (error) {
      return {
        status: 'error',
      };
    }
  }

  private async checkRedis(): Promise<{
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
  }> {
    try {
      const redis = RedisClient.getInstance().getClient();
      const startTime = Date.now();
      
      // Perform a simple ping operation
      const result = await redis.ping();
      const responseTime = Date.now() - startTime;
      
      if (result === 'PONG') {
        return {
          status: 'connected',
          responseTime,
        };
      }
      
      return {
        status: 'disconnected',
      };
    } catch (error) {
      return {
        status: 'error',
      };
    }
  }

  private getMemoryInfo(): {
    used: number;
    total: number;
    percentage: number;
  } {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    
    return {
      used: Math.round(usedMemory / 1024 / 1024), // Convert to MB
      total: Math.round(totalMemory / 1024 / 1024), // Convert to MB
      percentage: Math.round((usedMemory / totalMemory) * 100),
    };
  }

  // Quick check for liveness probe (Kubernetes/Docker)
  async isAlive(): Promise<boolean> {
    return true; // Process is running
  }

  // Detailed check for readiness probe
  async isReady(): Promise<boolean> {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();
    
    return (
      dbStatus.status === 'connected' && 
      redisStatus.status === 'connected'
    );
  }
}

export const healthCheckService = new HealthCheckService();
