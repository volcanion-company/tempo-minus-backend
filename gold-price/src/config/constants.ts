export const CACHE_KEYS = {
  CURRENT_PRICES: 'prices:current',
  PRICE_BY_CODE: (code: string) => `prices:${code}`,
  HISTORY: (code: string, period: string) => `history:${code}:${period}`,
  USER_SESSION: (userId: string) => `session:${userId}`,
  RATE_LIMIT: (ip: string) => `ratelimit:${ip}`,
  RATE_LIMIT_USER: (userId: string) => `ratelimit:user:${userId}`,
};

export const TTL = {
  CURRENT_PRICES: 60, // 1 minute
  SINGLE_PRICE: 60, // 1 minute
  HISTORY_MINUTE: 60, // 1 minute
  HISTORY_HOUR: 300, // 5 minutes
  HISTORY_DAY: 3600, // 1 hour
  USER_SESSION: 86400, // 24 hours
  RATE_LIMIT: 60, // 1 minute
};

export const RATE_LIMITS = {
  GUEST: {
    MAX: 60,
    WINDOW: 60, // per minute
  },
  USER: {
    MAX: 120,
    WINDOW: 60,
  },
  PREMIUM: {
    MAX: 300,
    WINDOW: 60,
  },
};

export const ALERT_LIMITS = {
  FREE: 2,
  PREMIUM: -1, // unlimited
};

export const PORTFOLIO_LIMITS = {
  FREE: {
    PORTFOLIOS: 1,
    ITEMS_PER_PORTFOLIO: 5,
  },
  PREMIUM: {
    PORTFOLIOS: -1, // unlimited
    ITEMS_PER_PORTFOLIO: -1, // unlimited
  },
};

export const GOLD_UNITS = {
  CHI: 'chi',
  LUONG: 'luong',
  GRAM: 'gram',
  OZ: 'oz',
} as const;

export const UNIT_CONVERSION = {
  CHI_TO_GRAM: 3.75,
  LUONG_TO_CHI: 10,
  LUONG_TO_GRAM: 37.5,
  OZ_TO_GRAM: 28.35,
};
