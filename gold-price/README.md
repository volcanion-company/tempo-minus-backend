# 🥇 Gold Price Backend API

Backend service cho ứng dụng theo dõi giá vàng Việt Nam, được xây dựng với Node.js, Express, TypeScript, MongoDB và Redis.

[![Node.js](https://img.shields.io/badge/Node.js->=20.0.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Tính Năng

- 📊 **REST API** - Endpoints chuẩn RESTful cho dữ liệu giá vàng
- ⚡ **Real-time Updates** - WebSocket (Socket.IO) cập nhật giá theo thời gian thực
- 🔐 **Authentication** - JWT với access/refresh tokens
- 🚀 **High Performance** - Redis caching và connection pooling
- 📈 **Price History** - Lịch sử giá với nhiều timeframe
- 🔔 **Price Alerts** - Thông báo khi giá đạt ngưỡng
- 📱 **Mobile Ready** - CORS và network config cho mobile apps
- 📝 **API Documentation** - Swagger/OpenAPI tích hợp
- 🐳 **Docker Support** - Dễ dàng deploy với Docker Compose

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.3 |
| Framework | Express.js 4.x |
| Database | MongoDB 7.x |
| Cache | Redis 7.x |
| WebSocket | Socket.IO 4.x |
| Authentication | JWT (jsonwebtoken) |
| Validation | Zod |
| Documentation | Swagger/OpenAPI |
| Testing | Vitest |
| Logging | Winston |

## 📋 Prerequisites

- Node.js >= 20.0.0
- MongoDB >= 7.0
- Redis >= 7.0
- npm >= 10.0.0

## 🚀 Quick Start

### 1. Clone và cài đặt

```bash
git clone https://github.com/your-username/gold-price-backend.git
cd gold-price-backend
npm install
```

### 2. Cấu hình environment

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/goldprice
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your-secret-key
```

### 3. Chạy services (Docker)

```bash
docker-compose up -d mongo redis
```

### 4. Start server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build && npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 📁 Project Structure

```
src/
├── config/          # Cấu hình (env, database, redis, swagger)
├── controllers/     # Request handlers
├── middleware/      # Express middleware (auth, rate limit, error)
├── models/          # Mongoose schemas
├── routes/          # API routes (versioned: v1)
├── services/        # Business logic
├── jobs/            # Background jobs (price fetcher)
├── utils/           # Utilities (logger, errors, helpers)
├── app.ts           # Express app setup
└── server.ts        # Entry point
```

## 📚 API Documentation

### Swagger UI

Truy cập `http://localhost:3000/api-docs` để xem interactive documentation.

### Base URL

```
http://localhost:3000/v1
```

### Public Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/prices` | Lấy tất cả giá vàng hiện tại |
| GET | `/prices/:code` | Lấy giá theo mã (SJC, PNJ, DOJI) |
| GET | `/history/:code` | Lấy lịch sử giá |
| GET | `/providers` | Danh sách nhà cung cấp |
| GET | `/health` | Health check |

### Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/register` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Đăng xuất |

### Protected Endpoints

Yêu cầu header: `Authorization: Bearer <access_token>`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/users/me` | Thông tin user |
| PATCH | `/users/me` | Cập nhật profile |
| GET | `/alerts` | Danh sách alerts |
| POST | `/alerts` | Tạo price alert |
| DELETE | `/alerts/:id` | Xóa alert |

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

## 🔌 WebSocket

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});
```

### Events

| Event | Direction | Mô tả |
|-------|-----------|-------|
| `prices:current` | Server→Client | Giá hiện tại khi kết nối |
| `prices:update` | Server→Client | Cập nhật giá mới |
| `prices:change` | Server→Client | Chi tiết thay đổi giá |
| `get:prices` | Client→Server | Yêu cầu giá hiện tại |
| `subscribe:gold` | Client→Server | Đăng ký theo dõi loại vàng |

### Example

```javascript
socket.on('prices:update', (data) => {
  console.log('New prices:', data);
});

socket.emit('subscribe:gold', ['SJC', 'PNJ']);
```

## 🔧 Scripts

| Command | Mô tả |
|---------|-------|
| `npm run dev` | Start development server với hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code với Prettier |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests với coverage |

## 🐳 Docker

### Development

```bash
docker-compose up -d
```

### Production Build

```bash
docker build -t gold-price-backend .
docker run -p 3000:3000 gold-price-backend
```

## 📱 Mobile Integration

Xem [docs/INTEGRATION.md](docs/INTEGRATION.md) để biết cách tích hợp với React Native Expo.

### Quick Setup

```javascript
// API
const API_URL = 'http://<YOUR_IP>:3000/v1';

// WebSocket
const socket = io('http://<YOUR_IP>:3000');
```

## 🔒 Security

- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Rate limiting (per IP/user)
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Input validation (Zod)

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/v1/health
```

### Logs

```
logs/
├── error.log      # Error logs only
└── combined.log   # All logs
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📖 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Kiến trúc hệ thống
- [CONTRIBUTING.md](CONTRIBUTING.md) - Hướng dẫn đóng góp
- [docs/INTEGRATION.md](docs/INTEGRATION.md) - Hướng dẫn tích hợp mobile

## 🤝 Contributing

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết cách đóng góp.

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Mở Pull Request

## 📄 License

[MIT License](LICENSE) - Xem file LICENSE để biết thêm chi tiết.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- [vang.today](https://vang.today) - Data provider
- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [MongoDB](https://www.mongodb.com/)

---

Made with ❤️ in Vietnam
