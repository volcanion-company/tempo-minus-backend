FROM node:20-alpine AS builder
WORKDIR /app

# 1. Copy dependency files trước để tận dụng cache
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# 2. Copy SOURCE CODE + tsconfig
COPY tsconfig.json ./
COPY src ./src

# 3. Build
RUN yarn build

# Debug safeguard (có thể xoá sau)
RUN ls -la dist

# =====================
# Runtime
# =====================
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# 4. Copy dist + node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]
