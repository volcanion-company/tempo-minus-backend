import { Response, NextFunction } from 'express';
import { cacheService } from '../services/cacheService';
import { CACHE_KEYS, RATE_LIMITS } from '../config/constants';
import { TooManyRequestsError } from '../utils/errors';
import { AuthRequest } from './auth';

export async function rateLimiter(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const user = req.user;

    // Determine rate limit based on user type
    let limit: number;
    let key: string;

    if (!user) {
      // Guest user
      limit = RATE_LIMITS.GUEST.MAX;
      key = CACHE_KEYS.RATE_LIMIT(ip);
    } else {
      // Authenticated user - check if premium
      // For now, use USER limits (can be extended with premium check)
      limit = RATE_LIMITS.USER.MAX;
      key = CACHE_KEYS.RATE_LIMIT_USER(user.userId);
    }

    // Increment request count
    const count = await cacheService.increment(key, RATE_LIMITS.GUEST.WINDOW);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));

    // Check if limit exceeded
    if (count > limit) {
      throw new TooManyRequestsError('Rate limit exceeded');
    }

    next();
  } catch (error) {
    next(error);
  }
}
