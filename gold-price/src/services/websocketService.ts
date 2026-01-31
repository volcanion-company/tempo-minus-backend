import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { cacheService } from './cacheService';
import { fetchService } from './fetchService';
import { CACHE_KEYS } from '../config/constants';
import { logger } from '../utils/logger';

export interface PriceChangeEvent {
  code: string;
  name: string;
  buy: number;
  sell: number;
  changeBuy: number;
  changeSell: number;
  currency: string;
  timestamp: Date;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients = 0;

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupConnectionHandlers();
    logger.info('WebSocket service initialized');
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      this.connectedClients++;
      logger.info(`Client connected: ${socket.id} (Total: ${this.connectedClients})`);

      // Send current prices from cache when client connects
      this.sendCurrentPrices(socket);

      // Handle client requesting current prices
      socket.on('get:prices', async () => {
        await this.sendCurrentPrices(socket);
      });

      // Handle client subscribing to specific gold types
      socket.on('subscribe:gold', (goldCodes: string[]) => {
        goldCodes.forEach(code => {
          socket.join(`gold:${code}`);
        });
        logger.debug(`Client ${socket.id} subscribed to: ${goldCodes.join(', ')}`);
      });

      // Handle client unsubscribing
      socket.on('unsubscribe:gold', (goldCodes: string[]) => {
        goldCodes.forEach(code => {
          socket.leave(`gold:${code}`);
        });
        logger.debug(`Client ${socket.id} unsubscribed from: ${goldCodes.join(', ')}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedClients--;
        logger.info(`Client disconnected: ${socket.id} (Total: ${this.connectedClients})`);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Send current prices to a specific client from Redis cache
   * If cache is empty, fetch from API, compare with DB, update if needed, and cache
   */
  private async sendCurrentPrices(socket: Socket): Promise<void> {
    try {
      // Lấy giá từ Redis cache
      let prices = await cacheService.get(CACHE_KEYS.CURRENT_PRICES);

      // Nếu cache không có dữ liệu, fetch từ API và cập nhật
      if (!prices) {
        logger.info(`Cache empty, fetching prices from API for client ${socket.id}`);
        try {
          // Gọi fetchService để:
          // 1. Lấy dữ liệu từ API
          // 2. So sánh với database, cập nhật nếu khác biệt
          // 3. Lưu vào cache
          await fetchService.fetchPrices();
          
          // Lấy lại từ cache sau khi fetch
          prices = await cacheService.get(CACHE_KEYS.CURRENT_PRICES);
        } catch (fetchError) {
          logger.error('Failed to fetch prices from API:', fetchError);
        }
      }

      if (prices) {
        socket.emit('prices:current', {
          success: true,
          data: prices,
          timestamp: new Date(),
          source: 'cache',
        });
        logger.debug(`Sent current prices to ${socket.id} from cache`);
      } else {
        socket.emit('prices:current', {
          success: false,
          message: 'No prices available in cache',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error sending current prices:', error);
      socket.emit('prices:error', {
        success: false,
        message: 'Failed to fetch prices',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Broadcast price changes to all connected clients
   * Called when fetchService detects price changes
   */
  async broadcastPriceChanges(changes: PriceChangeEvent[]): Promise<void> {
    if (!this.io || changes.length === 0) return;

    try {
      // Lấy tất cả prices mới nhất từ cache
      const allPrices = await cacheService.get(CACHE_KEYS.CURRENT_PRICES);

      // Broadcast to all clients
      this.io.emit('prices:updated', {
        success: true,
        changes,
        allPrices,
        timestamp: new Date(),
        source: 'cache',
      });

      // Broadcast to specific rooms (clients subscribed to specific gold types)
      changes.forEach(change => {
        this.io!.to(`gold:${change.code}`).emit('price:changed', {
          success: true,
          data: change,
          timestamp: new Date(),
        });
      });

      logger.info(`Broadcasted ${changes.length} price changes to ${this.connectedClients} clients`);
    } catch (error) {
      logger.error('Error broadcasting price changes:', error);
    }
  }

  /**
   * Broadcast a single price update
   */
  async broadcastPriceUpdate(code: string): Promise<void> {
    if (!this.io) return;

    try {
      const prices: any[] | null = await cacheService.get(CACHE_KEYS.CURRENT_PRICES);
      const price = prices && Array.isArray(prices) ? prices.find((p: any) => p.code === code) : null;

      if (price) {
        this.io.to(`gold:${code}`).emit('price:changed', {
          success: true,
          data: price,
          timestamp: new Date(),
          source: 'cache',
        });
      }
    } catch (error) {
      logger.error(`Error broadcasting price update for ${code}:`, error);
    }
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients;
  }

  /**
   * Check if WebSocket is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();
