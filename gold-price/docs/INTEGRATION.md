# Hướng Dẫn Tích Hợp Gold Price API

Tài liệu chi tiết hướng dẫn tích hợp Gold Price API vào ứng dụng React Native Expo hoặc các ứng dụng mobile/web khác.

## 📋 Mục Lục

- [Yêu Cầu](#-yêu-cầu)
- [Cấu Hình Server](#-cấu-hình-server)
- [Kết Nối Từ Thiết Bị Di Động](#-kết-nối-từ-thiết-bị-di-động)
- [API Reference](#-api-reference)
  - [Health Check](#health-check-endpoints)
  - [Price Endpoints](#price-endpoints)
  - [Provider Endpoints](#provider-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
- [WebSocket Reference](#-websocket-reference)
- [Response Formats](#-response-formats)
- [React Native Expo Integration](#-react-native-expo-integration)
- [Xử Lý Lỗi](#-xử-lý-lỗi)
- [FAQ & Troubleshooting](#-faq--troubleshooting)

---

## 📦 Yêu Cầu

### Server
- Node.js >= 20.0.0
- MongoDB >= 7.0
- Redis >= 7.0

### Client (React Native Expo)
```bash
npx expo install axios socket.io-client
# hoặc
npm install axios socket.io-client
```

---

## 🖥️ Cấu Hình Server

### 1. Khởi Động Server

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm run build && npm start
```

### 2. Server Output

Khi khởi động, server sẽ hiển thị:

```
Server running on 0.0.0.0:3000 in development mode
API version: v1
WebSocket server ready for connections
Available on:
  http://192.168.10.126:3000
  WebSocket: ws://192.168.10.126:3000
```

> **Lưu ý về WebSocket URL:**
> - **Socket.IO client**: Sử dụng `http://` - thư viện tự động upgrade lên WebSocket
> - **Native WebSocket**: Sử dụng `ws://` hoặc `wss://` (cho HTTPS)

### 3. Environment Configuration

Tạo file `.env` từ `.env.example`:

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/goldprice
REDIS_URL=redis://localhost:6379

# CORS - Cho phép tất cả origins trong development
CORS_ORIGIN=*

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

---

## 📱 Kết Nối Từ Thiết Bị Di Động

### Checklist
- ✅ Thiết bị di động và máy tính **cùng mạng WiFi**
- ✅ Windows Firewall đã cho phép port 3000
- ✅ Sử dụng **HTTP** (không phải HTTPS)
- ✅ URL có **port 3000**

### Mở Firewall (Windows)

Chạy lệnh sau với quyền **Administrator**:

```powershell
netsh advfirewall firewall add rule name="Gold Price API" dir=in action=allow protocol=TCP localport=3000
```

### Lấy IP Máy Tính

```powershell
# Windows
ipconfig | findstr "IPv4"

# Hoặc xem trong console khi chạy server
```

### Kiểm Tra Kết Nối

Từ thiết bị di động, mở trình duyệt:
```
http://192.168.10.126:3000
```

---

## 📡 API Reference

### Base URL

```
http://<IP_ADDRESS>:3000/v1
```

Ví dụ: `http://192.168.10.126:3000/v1`

---

### Health Check Endpoints

#### GET /v1/health
Kiểm tra trạng thái chi tiết của hệ thống.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "timestamp": "2026-01-30T10:00:00.000Z",
    "services": {
      "mongodb": { "status": "connected", "latency": 5 },
      "redis": { "status": "connected", "latency": 2 }
    },
    "memory": {
      "used": 150000000,
      "total": 500000000,
      "percentage": 30
    },
    "websocket": {
      "connectedClients": 5
    }
  }
}
```

#### GET /v1/health/live
Liveness probe cho Kubernetes/Docker.

**Response:**
```json
{
  "status": "alive"
}
```

#### GET /v1/health/ready
Readiness probe - kiểm tra database và redis đã sẵn sàng.

**Response:**
```json
{
  "status": "ready"
}
```

---

### Price Endpoints

#### GET /v1/prices
Lấy tất cả giá vàng hiện tại.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `currency` | string | Filter theo currency: `VND` hoặc `USD` |

**Request:**
```javascript
const response = await axios.get('/v1/prices');
// hoặc với filter
const response = await axios.get('/v1/prices?currency=VND');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 12,
    "prices": [
      {
        "_id": "...",
        "code": "SJC",
        "name": "Vàng SJC 1L - 10L",
        "buy": 79500000,
        "sell": 81000000,
        "changeBuy": 100000,
        "changeSell": 150000,
        "currency": "VND",
        "source": "vang.today",
        "updatedAt": "2026-01-30T10:00:00.000Z"
      }
    ]
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### GET /v1/prices/:code
Lấy giá theo mã vàng.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Mã vàng: `SJC`, `PNJ`, `DOJI`, etc. |

**Request:**
```javascript
const response = await axios.get('/v1/prices/SJC');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "code": "SJC",
    "name": "Vàng SJC 1L - 10L",
    "buy": 79500000,
    "sell": 81000000,
    "changeBuy": 100000,
    "changeSell": 150000,
    "currency": "VND",
    "source": "vang.today",
    "updatedAt": "2026-01-30T10:00:00.000Z"
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Price not found for code: XYZ"
  }
}
```

---

#### GET /v1/prices/:code/history
Lấy lịch sử giá.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Mã vàng |

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `day` | Granularity: `minute`, `hour`, `day`, `week`, `month` |
| `from` | ISO date | - | Ngày bắt đầu |
| `to` | ISO date | - | Ngày kết thúc |
| `limit` | number | 100 | Số lượng records tối đa (max: 1000) |

**Request:**
```javascript
// Lấy 7 ngày gần nhất
const response = await axios.get('/v1/prices/SJC/history', {
  params: {
    period: 'day',
    limit: 7
  }
});

// Lấy theo khoảng thời gian
const response = await axios.get('/v1/prices/SJC/history', {
  params: {
    period: 'hour',
    from: '2026-01-25T00:00:00.000Z',
    to: '2026-01-30T23:59:59.000Z'
  }
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "SJC",
    "period": "day",
    "count": 7,
    "history": [
      {
        "_id": "...",
        "code": "SJC",
        "buy": 79500000,
        "sell": 81000000,
        "recordedAt": "2026-01-30T00:00:00.000Z",
        "source": "vang.today"
      }
    ]
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### GET /v1/prices/:code/statistics
Lấy thống kê giá.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | number | 30 | Số ngày để tính thống kê |

**Request:**
```javascript
const response = await axios.get('/v1/prices/SJC/statistics?days=30');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "SJC",
    "period": "30 days",
    "buy": {
      "current": 79500000,
      "min": 78000000,
      "max": 80000000,
      "avg": 79000000,
      "change": 500000,
      "changePercent": 0.63
    },
    "sell": {
      "current": 81000000,
      "min": 79500000,
      "max": 82000000,
      "avg": 80500000,
      "change": 500000,
      "changePercent": 0.62
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### GET /v1/prices/compare
So sánh giá giữa các loại vàng.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `codes` | string | Danh sách mã, phân cách bởi dấu phẩy |

**Request:**
```javascript
const response = await axios.get('/v1/prices/compare?codes=SJC,PNJ,DOJI');
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prices": [
      { "code": "SJC", "buy": 79500000, "sell": 81000000 },
      { "code": "PNJ", "buy": 79300000, "sell": 80800000 },
      { "code": "DOJI", "buy": 79400000, "sell": 80900000 }
    ],
    "bestBuy": { "code": "PNJ", "price": 79300000 },
    "bestSell": { "code": "SJC", "price": 81000000 },
    "spread": {
      "SJC": 1500000,
      "PNJ": 1500000,
      "DOJI": 1500000
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### POST /v1/prices/refresh
Làm mới giá từ nguồn bên ngoài (manual trigger).

**Request:**
```javascript
const response = await axios.post('/v1/prices/refresh');
```

**Response:**
```json
{
  "success": true,
  "message": "Prices refreshed successfully",
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

### Provider Endpoints

#### GET /v1/providers
Lấy danh sách nhà cung cấp vàng.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "code": "SJC",
      "name": "Công ty TNHH MTV Vàng Bạc Đá Quý Sài Gòn",
      "shortName": "SJC",
      "website": "https://sjc.com.vn",
      "isActive": true
    }
  ],
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

#### GET /v1/providers/:code
Lấy thông tin nhà cung cấp theo mã.

```javascript
const response = await axios.get('/v1/providers/SJC');
```

---

### Authentication Endpoints

#### POST /v1/auth/register
Đăng ký tài khoản mới.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nguyen Van A"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "name": "Nguyen Van A",
      "role": "user",
      "subscription": "free",
      "createdAt": "2026-01-30T10:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "15m"
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### POST /v1/auth/login
Đăng nhập.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "name": "Nguyen Van A"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "15m"
    }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### POST /v1/auth/refresh
Làm mới access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "15m"
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### GET /v1/auth/me
Lấy thông tin user hiện tại. **Yêu cầu Authentication.**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "name": "Nguyen Van A",
    "role": "user",
    "subscription": "free"
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

---

#### PATCH /v1/auth/me
Cập nhật thông tin user. **Yêu cầu Authentication.**

**Request Body:**
```json
{
  "name": "Nguyen Van B"
}
```

---

#### DELETE /v1/auth/me
Xóa tài khoản. **Yêu cầu Authentication.**

---

#### PUT /v1/auth/password
Đổi mật khẩu. **Yêu cầu Authentication.**

**Request Body:**
```json
{
  "currentPassword": "29121994",
  "newPassword": "29121994a@A"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Current password is incorrect"
  }
}
```

---

#### PUT /v1/auth/profile
Cập nhật thông tin người dùng (tên, avatar, preferences). **Yêu cầu Authentication.**

**Request Body:**
```json
{
  "name": "Example name"
}
```

Hoặc cập nhật nhiều field:
```json
{
  "name": "Nguyen Van A",
  "avatar": "https://example.com/avatar.jpg",
  "preferences": {
    "language": "en",
    "currency": "USD",
    "darkMode": true,
    "notifications": {
      "push": true,
      "email": false
    }
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "name": "Example name",
    "role": "user",
    "isPremium": false,
    "preferences": {
      "language": "vi",
      "currency": "VND",
      "darkMode": false,
      "notifications": {
        "push": true,
        "email": true
      }
    },
    "createdAt": "2026-01-30T04:25:46.353Z",
    "updatedAt": "2026-01-30T04:36:03.295Z"
  },
  "timestamp": "2026-01-30T04:36:03.302Z"
}
```

---

## 🔄 WebSocket Reference

### Connection

Backend sử dụng **Socket.IO** cho WebSocket. Khi dùng Socket.IO client, bạn kết nối bằng `http://`, thư viện sẽ tự động upgrade lên WebSocket protocol.

```javascript
import { io } from 'socket.io-client';

// Socket.IO sử dụng http:// - KHÔNG phải ws://
const socket = io('http://192.168.10.126:3000', {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
```

> ⚠️ **Quan trọng:**
> - Socket.IO client → dùng `http://` hoặc `https://`
> - Native WebSocket API → dùng `ws://` hoặc `wss://`
> 
> Đây là 2 protocol khác nhau. Socket.IO không tương thích với native WebSocket client.

### Events Overview

| Event | Direction | Trigger | Description |
|-------|-----------|---------|-------------|
| `connect` | System | Kết nối thành công | Socket connected |
| `disconnect` | System | Mất kết nối | Socket disconnected |
| `connect_error` | System | Lỗi kết nối | Connection error |
| `prices:current` | Server→Client | Khi connect | Giá hiện tại từ cache |
| `prices:updated` | Server→Client | Khi có thay đổi | Tất cả giá mới + thay đổi |
| `price:changed` | Server→Client | Khi subscribe | Thay đổi giá cụ thể |
| `prices:error` | Server→Client | Lỗi fetch | Thông báo lỗi |
| `get:prices` | Client→Server | Manual | Yêu cầu giá hiện tại |
| `subscribe:gold` | Client→Server | Manual | Đăng ký theo dõi loại vàng |
| `unsubscribe:gold` | Client→Server | Manual | Hủy đăng ký |

---

### Event Details

#### prices:current
Nhận giá hiện tại khi kết nối hoặc khi emit `get:prices`.

```javascript
socket.on('prices:current', (data) => {
  console.log(data);
  /*
  {
    success: true,
    data: [
      {
        code: "SJC",
        name: "Vàng SJC 1L - 10L",
        buy: 79500000,
        sell: 81000000,
        changeBuy: 100000,
        changeSell: 150000,
        currency: "VND",
        updatedAt: "2026-01-30T10:00:00.000Z"
      },
      ...
    ],
    timestamp: "2026-01-30T10:00:00.000Z",
    source: "cache"
  }
  */
});
```

---

#### prices:updated
Nhận cập nhật khi có thay đổi giá (broadcast tới tất cả clients).

```javascript
socket.on('prices:updated', (data) => {
  console.log(data);
  /*
  {
    success: true,
    changes: [
      {
        code: "SJC",
        name: "Vàng SJC 1L - 10L",
        buy: 79600000,
        sell: 81100000,
        changeBuy: 100000,
        changeSell: 100000,
        currency: "VND",
        timestamp: "2026-01-30T10:01:00.000Z"
      }
    ],
    allPrices: [...],  // Tất cả giá mới nhất
    timestamp: "2026-01-30T10:01:00.000Z",
    source: "cache"
  }
  */
});
```

---

#### price:changed
Nhận thay đổi cho loại vàng đã subscribe. Chỉ nhận nếu đã emit `subscribe:gold`.

```javascript
// Đăng ký theo dõi
socket.emit('subscribe:gold', ['SJC', 'PNJ']);

// Nhận thay đổi
socket.on('price:changed', (data) => {
  console.log(data);
  /*
  {
    success: true,
    data: {
      code: "SJC",
      name: "Vàng SJC 1L - 10L",
      buy: 79600000,
      sell: 81100000,
      changeBuy: 100000,
      changeSell: 100000,
      currency: "VND"
    },
    timestamp: "2026-01-30T10:01:00.000Z"
  }
  */
});
```

---

#### Client Emit Events

```javascript
// Yêu cầu giá hiện tại
socket.emit('get:prices');

// Đăng ký theo dõi loại vàng cụ thể
socket.emit('subscribe:gold', ['SJC', 'PNJ', 'DOJI']);

// Hủy đăng ký
socket.emit('unsubscribe:gold', ['DOJI']);
```

---

## 📋 Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { ... }
  },
  "timestamp": "2026-01-30T10:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 📲 React Native Expo Integration

### 1. Project Structure

```
src/
├── config/
│   └── api.ts
├── services/
│   ├── api.ts
│   └── socket.ts
├── hooks/
│   ├── useSocket.ts
│   ├── usePrices.ts
│   └── useAuth.ts
├── stores/
│   └── priceStore.ts
├── types/
│   └── index.ts
└── screens/
    └── PriceScreen.tsx
```

### 2. Types Definition

```typescript
// src/types/index.ts

export interface Price {
  _id: string;
  code: string;
  name: string;
  buy: number;
  sell: number;
  changeBuy: number;
  changeSell: number;
  currency: 'VND' | 'USD';
  source: string;
  updatedAt: string;
}

export interface PriceHistory {
  _id: string;
  code: string;
  buy: number;
  sell: number;
  recordedAt: string;
  source: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  subscription: 'free' | 'premium';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PriceChange {
  code: string;
  name: string;
  buy: number;
  sell: number;
  changeBuy: number;
  changeSell: number;
  currency: string;
  timestamp: string;
}
```

### 3. API Configuration

```typescript
// src/config/api.ts
import Constants from 'expo-constants';

const DEV_API_URL = 'http://192.168.10.126:3000'; // Thay bằng IP của bạn
const PROD_API_URL = 'https://api.yourdomain.com';

export const API_CONFIG = {
  baseURL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  apiVersion: 'v1',
  timeout: 15000,
};

export const getApiUrl = () => `${API_CONFIG.baseURL}/${API_CONFIG.apiVersion}`;
export const getSocketUrl = () => API_CONFIG.baseURL;
```

### 4. API Service

```typescript
// src/services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../config/api';
import { Price, PriceHistory, User, AuthTokens, ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: getApiUrl(),
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshed = await this.tryRefreshToken();
          if (refreshed && error.config) {
            // Retry original request
            return this.api.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const response = await axios.post(`${getApiUrl()}/auth/refresh`, {
        refreshToken,
      });

      if (response.data.success) {
        await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
        return true;
      }
      return false;
    } catch {
      await this.clearTokens();
      return false;
    }
  }

  private async clearTokens() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  }

  // Price APIs
  async getAllPrices(currency?: 'VND' | 'USD'): Promise<ApiResponse<{ count: number; prices: Price[] }>> {
    const params = currency ? { currency } : {};
    return this.api.get('/prices', { params });
  }

  async getPriceByCode(code: string): Promise<ApiResponse<Price>> {
    return this.api.get(`/prices/${code}`);
  }

  async getPriceHistory(
    code: string,
    options?: {
      period?: 'minute' | 'hour' | 'day' | 'week' | 'month';
      from?: string;
      to?: string;
      limit?: number;
    }
  ): Promise<ApiResponse<{ code: string; period: string; count: number; history: PriceHistory[] }>> {
    return this.api.get(`/prices/${code}/history`, { params: options });
  }

  async getPriceStatistics(code: string, days = 30): Promise<ApiResponse<any>> {
    return this.api.get(`/prices/${code}/statistics`, { params: { days } });
  }

  async comparePrices(codes?: string[]): Promise<ApiResponse<any>> {
    const params = codes ? { codes: codes.join(',') } : {};
    return this.api.get('/prices/compare', { params });
  }

  async refreshPrices(): Promise<ApiResponse<{ message: string }>> {
    return this.api.post('/prices/refresh');
  }

  // Auth APIs
  async register(email: string, password: string, name: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.api.post('/auth/register', { email, password, name });
    if (response.success) {
      await this.saveTokens(response.data.tokens);
    }
    return response;
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.success) {
      await this.saveTokens(response.data.tokens);
    }
    return response;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.api.get('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.api.patch('/auth/me', data);
  }

  async logout() {
    await this.clearTokens();
  }

  private async saveTokens(tokens: AuthTokens) {
    await AsyncStorage.setItem('accessToken', tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
  }

  // Health
  async checkHealth(): Promise<ApiResponse<any>> {
    return this.api.get('/health');
  }
}

export const apiService = new ApiService();
```

### 5. Socket Service

```typescript
// src/services/socket.ts
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../config/api';
import { Price, PriceChange } from '../types';

type PriceCallback = (prices: Price[]) => void;
type ChangeCallback = (changes: PriceChange[]) => void;
type ConnectionCallback = (connected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private priceCallbacks: PriceCallback[] = [];
  private changeCallbacks: ChangeCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connectionCallbacks.forEach(cb => cb(true));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionCallbacks.forEach(cb => cb(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Price events
    this.socket.on('prices:current', (data) => {
      if (data.success && data.data) {
        this.priceCallbacks.forEach(cb => cb(data.data));
      }
    });

    this.socket.on('prices:updated', (data) => {
      if (data.success) {
        if (data.allPrices) {
          this.priceCallbacks.forEach(cb => cb(data.allPrices));
        }
        if (data.changes) {
          this.changeCallbacks.forEach(cb => cb(data.changes));
        }
      }
    });

    this.socket.on('price:changed', (data) => {
      if (data.success && data.data) {
        this.changeCallbacks.forEach(cb => cb([data.data]));
      }
    });

    this.socket.on('prices:error', (data) => {
      console.error('Price error:', data.message);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Subscribe to specific gold types
  subscribeToGold(codes: string[]) {
    this.socket?.emit('subscribe:gold', codes);
  }

  unsubscribeFromGold(codes: string[]) {
    this.socket?.emit('unsubscribe:gold', codes);
  }

  // Request current prices
  requestPrices() {
    this.socket?.emit('get:prices');
  }

  // Callbacks
  onPrices(callback: PriceCallback) {
    this.priceCallbacks.push(callback);
    return () => {
      this.priceCallbacks = this.priceCallbacks.filter(cb => cb !== callback);
    };
  }

  onPriceChange(callback: ChangeCallback) {
    this.changeCallbacks.push(callback);
    return () => {
      this.changeCallbacks = this.changeCallbacks.filter(cb => cb !== callback);
    };
  }

  onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
```

### 6. Custom Hooks

```typescript
// src/hooks/usePrices.ts
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { socketService } from '../services/socket';
import { Price, PriceChange } from '../types';

export const usePrices = () => {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastChange, setLastChange] = useState<PriceChange[] | null>(null);

  useEffect(() => {
    // Connect socket
    socketService.connect();

    // Listen for prices
    const unsubPrices = socketService.onPrices((newPrices) => {
      setPrices(newPrices);
      setLoading(false);
    });

    // Listen for changes
    const unsubChanges = socketService.onPriceChange((changes) => {
      setLastChange(changes);
      // Auto-clear after 5 seconds
      setTimeout(() => setLastChange(null), 5000);
    });

    // Listen for connection
    const unsubConnection = socketService.onConnectionChange(setIsConnected);

    // Initial fetch via API as fallback
    fetchPrices();

    return () => {
      unsubPrices();
      unsubChanges();
      unsubConnection();
      socketService.disconnect();
    };
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllPrices();
      if (response.success) {
        setPrices(response.data.prices);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (isConnected) {
      socketService.requestPrices();
    } else {
      fetchPrices();
    }
  }, [isConnected, fetchPrices]);

  const subscribeToGold = useCallback((codes: string[]) => {
    socketService.subscribeToGold(codes);
  }, []);

  return {
    prices,
    loading,
    error,
    isConnected,
    lastChange,
    refresh,
    subscribeToGold,
  };
};
```

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const response = await apiService.getProfile();
        if (response.success) {
          setUser(response.data);
        }
      }
    } catch {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.register(email, password, name);
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiService.logout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
};
```

### 7. Price Screen Component

```typescript
// src/screens/PriceScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { usePrices } from '../hooks/usePrices';
import { Price } from '../types';

const formatPrice = (price: number): string => {
  return price.toLocaleString('vi-VN') + ' đ';
};

const formatChange = (change: number): string => {
  const prefix = change > 0 ? '+' : '';
  return prefix + change.toLocaleString('vi-VN');
};

const PriceCard = ({ item, isChanged }: { item: Price; isChanged: boolean }) => (
  <View style={[styles.priceCard, isChanged && styles.priceCardChanged]}>
    <View style={styles.cardHeader}>
      <Text style={styles.goldCode}>{item.code}</Text>
      <View style={[
        styles.currencyBadge,
        { backgroundColor: item.currency === 'VND' ? '#e3f2fd' : '#fff3e0' }
      ]}>
        <Text style={styles.currencyText}>{item.currency}</Text>
      </View>
    </View>
    
    <Text style={styles.goldName}>{item.name}</Text>
    
    <View style={styles.priceRow}>
      <View style={styles.priceCol}>
        <Text style={styles.priceLabel}>Mua vào</Text>
        <Text style={styles.buyPrice}>{formatPrice(item.buy)}</Text>
        {item.changeBuy !== 0 && (
          <Text style={[
            styles.changeText,
            { color: item.changeBuy > 0 ? '#4CAF50' : '#f44336' }
          ]}>
            {formatChange(item.changeBuy)}
          </Text>
        )}
      </View>
      
      <View style={styles.priceCol}>
        <Text style={styles.priceLabel}>Bán ra</Text>
        <Text style={styles.sellPrice}>{formatPrice(item.sell)}</Text>
        {item.changeSell !== 0 && (
          <Text style={[
            styles.changeText,
            { color: item.changeSell > 0 ? '#4CAF50' : '#f44336' }
          ]}>
            {formatChange(item.changeSell)}
          </Text>
        )}
      </View>
    </View>
    
    <Text style={styles.updatedAt}>
      Cập nhật: {new Date(item.updatedAt).toLocaleTimeString('vi-VN')}
    </Text>
  </View>
);

export const PriceScreen = () => {
  const { prices, loading, error, isConnected, lastChange, refresh } = usePrices();
  const [refreshing, setRefreshing] = React.useState(false);

  const changedCodes = lastChange?.map(c => c.code) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading && prices.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Đang tải giá vàng...</Text>
      </View>
    );
  }

  if (error && prices.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Giá Vàng Hôm Nay</Text>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Realtime' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Price List */}
      <FlatList
        data={prices}
        renderItem={({ item }) => (
          <PriceCard
            item={item}
            isChanged={changedCodes.includes(item.code)}
          />
        )}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFD700']}
            tintColor="#FFD700"
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#FFD700',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    padding: 16,
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceCardChanged: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goldCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  currencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  goldName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceCol: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  buyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  sellPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  changeText: {
    fontSize: 12,
    marginTop: 2,
  },
  updatedAt: {
    fontSize: 11,
    color: '#999',
    marginTop: 12,
    textAlign: 'right',
  },
});
```

---

## ⚠️ Xử Lý Lỗi

### API Error Handler

```typescript
// src/utils/errorHandler.ts
import { Alert } from 'react-native';
import { AxiosError } from 'axios';

export const handleApiError = (error: AxiosError<any>) => {
  if (!error.response) {
    // Network error
    if (error.message === 'Network Error') {
      Alert.alert('Lỗi kết nối', 'Không có kết nối mạng. Vui lòng kiểm tra lại.');
    } else if (error.code === 'ECONNABORTED') {
      Alert.alert('Timeout', 'Yêu cầu quá thời gian. Vui lòng thử lại.');
    }
    return;
  }

  const { status, data } = error.response;
  const message = data?.error?.message || 'Đã có lỗi xảy ra';

  switch (status) {
    case 400:
      Alert.alert('Lỗi', message);
      break;
    case 401:
      Alert.alert('Phiên hết hạn', 'Vui lòng đăng nhập lại.');
      break;
    case 403:
      Alert.alert('Không có quyền', message);
      break;
    case 404:
      Alert.alert('Không tìm thấy', message);
      break;
    case 429:
      Alert.alert('Quá nhiều yêu cầu', 'Vui lòng thử lại sau ít phút.');
      break;
    case 500:
      Alert.alert('Lỗi server', 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      break;
    default:
      Alert.alert('Lỗi', message);
  }
};
```

### Socket Reconnection

```typescript
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Reconnection attempt ${attemptNumber}`);
});

socket.on('reconnect_failed', () => {
  Alert.alert('Mất kết nối', 'Không thể kết nối lại. Vui lòng kiểm tra mạng.');
});
```

---

## ❓ FAQ & Troubleshooting

### 1. Không kết nối được từ điện thoại

**Checklist:**
- [ ] Điện thoại và máy tính cùng mạng WiFi
- [ ] Sử dụng `http://` không phải `https://`
- [ ] URL có port `:3000`
- [ ] Windows Firewall đã mở port 3000
- [ ] Server đang chạy (`npm run dev`)

**Lấy IP máy tính:**
```powershell
ipconfig | findstr "IPv4"
```

### 2. CORS Error

Đảm bảo server có config:
```env
CORS_ORIGIN=*
NODE_ENV=development
```

### 3. WebSocket không kết nối

Thử polling trước:
```javascript
const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
});
```

### 4. Swagger UI trắng

Truy cập URL đầy đủ: `http://192.168.10.126:3000/api-docs`
- Dùng HTTP, không HTTPS
- Có port 3000

### 5. Request timeout

```javascript
const api = axios.create({
  timeout: 30000, // 30 giây
});
```

### 6. Rate Limit (429)

Mặc định: 60 requests/phút cho guest, 120 cho user đã đăng nhập.

---

## 📞 Hỗ Trợ

| Resource | URL |
|----------|-----|
| Swagger Docs | `http://<IP>:3000/api-docs` |
| Health Check | `http://<IP>:3000/v1/health` |
| WebSocket Test | `http://<IP>:3000/test-websocket.html` |

---

## 📄 License

MIT License
