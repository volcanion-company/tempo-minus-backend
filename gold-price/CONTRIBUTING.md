# Hướng Dẫn Đóng Góp

Cảm ơn bạn đã quan tâm đến việc đóng góp cho Gold Price Backend! Tài liệu này hướng dẫn cách bạn có thể tham gia phát triển dự án.

## 📋 Mục Lục

- [Code of Conduct](#-code-of-conduct)
- [Cách Đóng Góp](#-cách-đóng-góp)
- [Development Setup](#-development-setup)
- [Coding Standards](#-coding-standards)
- [Commit Convention](#-commit-convention)
- [Pull Request Process](#-pull-request-process)
- [Testing](#-testing)
- [Documentation](#-documentation)

---

## 📜 Code of Conduct

### Nguyên Tắc Cơ Bản

- **Tôn trọng** - Đối xử với mọi người một cách tôn trọng
- **Xây dựng** - Đóng góp phản hồi mang tính xây dựng
- **Hợp tác** - Làm việc cùng nhau để cải thiện dự án
- **Chuyên nghiệp** - Giữ thái độ chuyên nghiệp trong mọi tương tác

---

## 🤝 Cách Đóng Góp

### 1. Báo Cáo Bug

Nếu bạn phát hiện bug, hãy tạo Issue với:

- **Tiêu đề rõ ràng** mô tả vấn đề
- **Các bước tái tạo** bug
- **Kết quả mong đợi** vs **kết quả thực tế**
- **Screenshots** nếu có thể
- **Môi trường**: OS, Node version, etc.

```markdown
## Bug Report

### Mô tả
[Mô tả ngắn gọn về bug]

### Các bước tái tạo
1. Đi đến '...'
2. Click vào '...'
3. Xem lỗi

### Kết quả mong đợi
[Điều gì đáng lẽ phải xảy ra]

### Kết quả thực tế
[Điều gì thực sự xảy ra]

### Môi trường
- OS: Windows 11
- Node: 20.10.0
- npm: 10.2.0
```

### 2. Đề Xuất Tính Năng

Tạo Issue với label `enhancement`:

```markdown
## Feature Request

### Mô tả
[Mô tả tính năng bạn muốn]

### Lý do
[Tại sao tính năng này hữu ích]

### Giải pháp đề xuất
[Cách bạn nghĩ nên implement]

### Alternatives
[Các giải pháp thay thế đã xem xét]
```

### 3. Đóng Góp Code

1. Fork repository
2. Tạo branch mới
3. Implement changes
4. Write tests
5. Submit Pull Request

---

## 💻 Development Setup

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB >= 7.0
- Redis >= 7.0
- Git

### Cài Đặt

```bash
# Clone repository
git clone https://github.com/your-username/gold-price-backend.git
cd gold-price-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start dependencies với Docker (recommended)
docker-compose up -d mongo redis

# Hoặc cài đặt MongoDB và Redis locally

# Start development server
npm run dev
```

### IDE Setup (VS Code)

Recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

Settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 📏 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good - Use explicit types
function calculatePrice(buy: number, sell: number): number {
  return (buy + sell) / 2;
}

// ❌ Bad - Avoid 'any'
function calculatePrice(buy: any, sell: any) {
  return (buy + sell) / 2;
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `goldPrice`, `currentUser` |
| Constants | UPPER_SNAKE_CASE | `CACHE_TTL`, `MAX_RETRIES` |
| Functions | camelCase | `fetchPrices()`, `validateUser()` |
| Classes | PascalCase | `PriceService`, `UserController` |
| Interfaces | PascalCase + I prefix | `IUser`, `IPriceData` |
| Types | PascalCase | `PriceResponse`, `UserRole` |
| Files | camelCase | `priceService.ts`, `userController.ts` |

### File Structure

```typescript
// 1. Imports - grouped and sorted
import { Router } from 'express';           // External
import { PriceService } from '../services'; // Internal
import { logger } from '../utils';          // Utils
import { IPriceData } from '../types';      // Types

// 2. Constants
const CACHE_TTL = 60;

// 3. Types/Interfaces (if not in separate file)
interface ILocalType {
  // ...
}

// 4. Main code (class/function)
export class PriceController {
  // ...
}

// 5. Helper functions (private)
function helperFunction() {
  // ...
}
```

### Error Handling

```typescript
// ✅ Good - Use custom errors
import { AppError } from '../utils/errors';

if (!user) {
  throw new AppError('User not found', 404);
}

// ✅ Good - Async error handling
export const getPrice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const price = await priceService.getByCode(req.params.code);
    res.json({ success: true, data: price });
  } catch (error) {
    next(error); // Let error handler middleware deal with it
  }
};
```

### Comments

```typescript
// ✅ Good - Explain WHY, not WHAT
// Cache invalidation happens every 60s to balance freshness vs performance
const CACHE_TTL = 60;

// ❌ Bad - Obvious comment
// Set cache TTL to 60
const CACHE_TTL = 60;

/**
 * Fetches current gold prices from external API
 * @param provider - The data provider to use
 * @returns Array of price data
 * @throws {AppError} If provider is unavailable
 */
async function fetchPrices(provider: string): Promise<IPrice[]> {
  // ...
}
```

---

## 📝 Commit Convention

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Mô tả |
|------|-------|
| `feat` | Tính năng mới |
| `fix` | Sửa bug |
| `docs` | Chỉ thay đổi documentation |
| `style` | Format code (không thay đổi logic) |
| `refactor` | Refactor code |
| `perf` | Cải thiện performance |
| `test` | Thêm/sửa tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### Examples

```bash
# Feature
git commit -m "feat(prices): add price comparison endpoint"

# Bug fix
git commit -m "fix(websocket): resolve connection timeout issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactor
git commit -m "refactor(services): extract caching logic to separate service"

# Breaking change
git commit -m "feat(api)!: change response format for /prices endpoint

BREAKING CHANGE: The 'price' field is now 'buy' and 'sell' separate fields"
```

---

## 🔄 Pull Request Process

### 1. Trước Khi Tạo PR

```bash
# Update từ main
git checkout main
git pull origin main

# Tạo branch mới
git checkout -b feature/your-feature-name

# Làm việc và commit
git add .
git commit -m "feat: your feature"

# Rebase với main mới nhất
git fetch origin
git rebase origin/main

# Push
git push origin feature/your-feature-name
```

### 2. PR Checklist

- [ ] Code follows coding standards
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No linting errors (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] Commit messages follow convention
- [ ] PR description is clear

### 3. PR Template

```markdown
## Description
[Mô tả thay đổi của bạn]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
[Mô tả cách bạn đã test]

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests
- [ ] New and existing tests pass
- [ ] I have updated the documentation
```

### 4. Review Process

1. **Auto checks** - Lint, tests, build
2. **Code review** - Ít nhất 1 reviewer approve
3. **Merge** - Squash and merge vào main

---

## 🧪 Testing

### Chạy Tests

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Viết Tests

```typescript
// src/services/__tests__/priceService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { priceService } from '../priceService';

describe('PriceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all prices from cache if available', async () => {
      // Arrange
      const mockPrices = [{ code: 'SJC', buy: 79000000 }];
      vi.spyOn(cacheService, 'get').mockResolvedValue(mockPrices);

      // Act
      const result = await priceService.getAll();

      // Assert
      expect(result).toEqual(mockPrices);
      expect(cacheService.get).toHaveBeenCalledWith('prices:current');
    });

    it('should fetch from database if cache miss', async () => {
      // ...
    });
  });
});
```

### Test Coverage Requirements

- **Minimum**: 70% coverage
- **Target**: 80%+ coverage
- **Critical paths**: 100% coverage (auth, payments)

---

## 📚 Documentation

### Khi Nào Cần Update Docs

- Thêm endpoint mới → Update Swagger
- Thay đổi config → Update `.env.example`
- Thay đổi architecture → Update `ARCHITECTURE.md`
- Thêm feature → Update `README.md`

### Swagger Documentation

```typescript
/**
 * @swagger
 * /v1/prices:
 *   get:
 *     summary: Get all current gold prices
 *     tags: [Prices]
 *     responses:
 *       200:
 *         description: List of gold prices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Price'
 */
router.get('/', priceController.getAll);
```

---

## 🏷️ Versioning

Dự án sử dụng [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1 (patch: bug fix)
1.0.1 → 1.1.0 (minor: new feature, backwards compatible)
1.1.0 → 2.0.0 (major: breaking change)
```

---

## 🙋 Cần Trợ Giúp?

- Tạo Issue với label `question`
- Email: [your-email@example.com]
- Discord: [your-discord-server]

---

## 🎉 Contributors

Cảm ơn tất cả những người đã đóng góp!

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

---

**Happy coding! 🚀**
