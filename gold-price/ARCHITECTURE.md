# Kiến Trúc Gold Price Backend

## 📐 Tổng Quan

Gold Price Backend được xây dựng theo kiến trúc **Layered Architecture** kết hợp với **Service-Oriented Design**, đảm bảo tính mở rộng, bảo trì và test được dễ dàng.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│         (Mobile App / Web App / External Services)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌───────────────┐   ┌───────────────┐
            │   REST API    │   │   WebSocket   │
            │  (Express)    │   │  (Socket.IO)  │
            └───────────────┘   └───────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE LAYER                            │
│     (Auth / Rate Limiter / Error Handler / Validation)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTROLLER LAYER                            │
│        (Request Handling / Input Validation / Response)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                              │
│              (Business Logic / Data Processing)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
      │   MongoDB   │ │    Redis    │ │ External    │
      │  (Primary)  │ │   (Cache)   │ │    APIs     │
      └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 📁 Cấu Trúc Thư Mục

```
gold-price-backend/
├── src/
│   ├── config/              # Cấu hình ứng dụng
│   │   ├── constants.ts     # Constants (cache keys, TTL, limits)
│   │   ├── database.ts      # MongoDB connection
│   │   ├── environment.ts   # Environment variables
│   │   ├── redis.ts         # Redis connection
│   │   └── swagger.ts       # Swagger/OpenAPI config
│   │
│   ├── controllers/         # Request handlers
│   │   ├── healthController.ts
│   │   ├── priceController.ts
│   │   ├── providerController.ts
│   │   ├── userController.ts
│   │   └── index.ts
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── errorHandler.ts  # Global error handling
│   │   ├── rateLimiter.ts   # Rate limiting
│   │   └── index.ts
│   │
│   ├── models/              # Mongoose schemas
│   │   ├── Alert.ts         # Price alerts
│   │   ├── Portfolio.ts     # User portfolios
│   │   ├── Price.ts         # Current prices
│   │   ├── PriceHistory.ts  # Historical data
│   │   ├── Provider.ts      # Data providers
│   │   ├── User.ts          # User accounts
│   │   └── index.ts
│   │
│   ├── routes/              # API routes
│   │   └── v1/
│   │       ├── authRoutes.ts
│   │       ├── priceRoutes.ts
│   │       ├── providerRoutes.ts
│   │       └── index.ts
│   │
│   ├── services/            # Business logic
│   │   ├── cacheService.ts      # Redis caching
│   │   ├── fetchService.ts      # External API fetching
│   │   ├── healthCheckService.ts
│   │   ├── priceService.ts      # Price operations
│   │   ├── providerService.ts   # Provider management
│   │   ├── userService.ts       # User operations
│   │   ├── websocketService.ts  # Real-time updates
│   │   └── index.ts
│   │
│   ├── jobs/                # Background jobs
│   │   ├── priceFetcher.ts  # Scheduled price fetching
│   │   └── index.ts
│   │
│   ├── utils/               # Utilities
│   │   ├── errors.ts        # Custom error classes
│   │   ├── helpers.ts       # Helper functions
│   │   └── logger.ts        # Winston logger
│   │
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── docs/                    # Documentation
│   └── INTEGRATION.md       # Integration guide
├── logs/                    # Log files
├── tests/                   # Test files
├── docker-compose.yml       # Docker services
├── Dockerfile               # Container build
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🔄 Luồng Dữ Liệu

### 1. REST API Flow

```
Client Request
     │
     ▼
[Express Router] ──▶ [Middleware Chain]
                           │
                           ├── CORS
                           ├── Rate Limiter
                           ├── Auth (JWT)
                           └── Body Parser
                           │
                           ▼
                    [Controller]
                           │
                           ▼
                     [Service]
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       [MongoDB]      [Redis Cache]   [External API]
            │              │              │
            └──────────────┴──────────────┘
                           │
                           ▼
                    [Controller]
                           │
                           ▼
                  [JSON Response]
```

### 2. WebSocket Flow

```
Client Connect
     │
     ▼
[Socket.IO Server]
     │
     ├── on('connection') ──▶ Send current prices from cache
     │
     ├── on('subscribe:gold') ──▶ Join room for specific gold types
     │
     ├── on('get:prices') ──▶ Fetch and emit current prices
     │
     └── on('disconnect') ──▶ Cleanup

Background Job (Price Fetcher)
     │
     ▼
[Fetch new prices from external API]
     │
     ▼
[Compare with cached prices]
     │
     ├── Changed? ──▶ emit('prices:update') to all clients
     │              └── emit('prices:change') with diff
     │
     └── Update Redis cache
```

### 3. Price Update Flow

```
┌─────────────────┐
│  node-cron      │
│  (Every 1 min)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  fetchService   │────▶│  External API   │
│                 │     │  (vang.today)   │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  priceService   │
│  - Parse data   │
│  - Validate     │
│  - Compare      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│MongoDB│ │ Redis │
│(Save) │ │(Cache)│
└───────┘ └───────┘
         │
         ▼
┌─────────────────┐
│websocketService │
│ - Broadcast     │
│ - Notify change │
└─────────────────┘
```

---

## 🧩 Components

### Config Layer

| File | Mô tả |
|------|-------|
| `environment.ts` | Load và validate environment variables |
| `database.ts` | MongoDB connection với retry logic |
| `redis.ts` | Redis client với connection pooling |
| `constants.ts` | Cache keys, TTL, rate limits |
| `swagger.ts` | OpenAPI specification |

### Service Layer

| Service | Trách nhiệm |
|---------|-------------|
| `priceService` | CRUD operations cho giá vàng |
| `cacheService` | Redis caching abstraction |
| `fetchService` | HTTP client cho external APIs |
| `websocketService` | Real-time broadcasting |
| `userService` | User management, authentication |
| `providerService` | Data provider management |
| `healthCheckService` | System health monitoring |

### Middleware

| Middleware | Chức năng |
|------------|-----------|
| `auth.ts` | JWT verification, user extraction |
| `rateLimiter.ts` | Request rate limiting by IP/user |
| `errorHandler.ts` | Global error handling, logging |

---

## 💾 Data Models

### Price Schema
```typescript
{
  code: string;        // "SJC", "PNJ", "DOJI"
  name: string;        // "Vàng SJC 1L"
  buy: number;         // Giá mua vào
  sell: number;        // Giá bán ra
  unit: string;        // "VND/lượng"
  provider: ObjectId;  // Reference to Provider
  updatedAt: Date;
}
```

### PriceHistory Schema
```typescript
{
  code: string;
  buy: number;
  sell: number;
  recordedAt: Date;    // Indexed for time-series queries
  source: string;
}
```

### User Schema
```typescript
{
  email: string;
  password: string;    // bcrypt hashed
  name: string;
  role: 'user' | 'admin';
  subscription: 'free' | 'premium';
  isActive: boolean;
  refreshToken: string;
}
```

---

## 🔐 Security

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Login   │────▶│  Verify  │────▶│  Issue   │
│ Request  │     │ Password │     │  Tokens  │
└──────────┘     └──────────┘     └──────────┘
                                        │
                 ┌──────────────────────┘
                 ▼
        ┌─────────────────┐
        │  Access Token   │ (15 min)
        │  Refresh Token  │ (7 days)
        └─────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Protected Route │
        │   auth.ts MW    │
        └─────────────────┘
```

### Security Layers

1. **Helmet.js** - HTTP security headers
2. **CORS** - Cross-origin resource sharing
3. **Rate Limiting** - Per IP/user request limits
4. **JWT** - Stateless authentication
5. **bcrypt** - Password hashing
6. **Zod** - Input validation

---

## ⚡ Caching Strategy

### Cache Hierarchy

```
Request ──▶ Redis Cache ──▶ MongoDB
               │
               ├── Hit? Return cached data (fast)
               │
               └── Miss? Query DB, cache result
```

### Cache Keys & TTL

| Key Pattern | TTL | Mô tả |
|-------------|-----|-------|
| `prices:current` | 60s | All current prices |
| `prices:{code}` | 60s | Single price by code |
| `history:{code}:{period}` | 5-60m | Historical data |
| `session:{userId}` | 24h | User session |
| `ratelimit:{ip}` | 60s | Rate limit counter |

---

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/goldprice
REDIS_URL=redis://localhost:6379

# Authentication
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# External API
VANG_TODAY_API=https://www.vang.today/api/prices

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*
```

---

## 🐳 Deployment

### Docker Architecture

```
┌─────────────────────────────────────────┐
│            Docker Compose               │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │   API   │  │ MongoDB │  │  Redis  │  │
│  │  :3000  │  │ :27017  │  │  :6379  │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  │
│       │            │            │       │
│       └────────────┴────────────┘       │
│              Internal Network           │
└─────────────────────────────────────────┘
              │
              ▼
      External Access :3000
```

### Scaling Considerations

- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Redis Cluster**: For cache high availability
- **MongoDB Replica Set**: For database redundancy
- **WebSocket Sticky Sessions**: Required for Socket.IO

---

## 📊 Monitoring

### Logging (Winston)

```
logs/
├── error.log      # Error level only
└── combined.log   # All levels
```

### Log Format
```json
{
  "level": "info",
  "message": "Server running on 0.0.0.0:3000",
  "service": "gold-price-api",
  "timestamp": "2026-01-30 10:00:00"
}
```

### Health Check

```
GET /v1/health

Response:
{
  "status": "healthy",
  "uptime": 3600,
  "mongodb": "connected",
  "redis": "connected",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

## 🧪 Testing Strategy

```
tests/
├── unit/           # Service unit tests
├── integration/    # API integration tests
└── e2e/            # End-to-end tests
```

### Test Stack
- **Vitest** - Test runner
- **Supertest** - HTTP assertions
- **MongoDB Memory Server** - In-memory database for tests

---

## 📈 Performance Optimizations

1. **Redis Caching** - Reduce database load
2. **Connection Pooling** - MongoDB & Redis
3. **Compression** - Gzip response compression
4. **Index Optimization** - MongoDB compound indexes
5. **Lazy Loading** - Load modules on demand
6. **WebSocket** - Reduce polling overhead

---

## 🔮 Future Improvements

- [ ] GraphQL API support
- [ ] Message queue (Bull/Redis) for async jobs
- [ ] Kubernetes deployment configs
- [ ] Prometheus metrics
- [ ] API versioning strategy (v2)
- [ ] Multi-region support
