import { Router } from 'express';
import { priceController } from '../../controllers/priceController.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Apply rate limiting to all routes
router.use(rateLimiter);

// GET /v1/prices - Get all current prices
router.get('/', priceController.getCurrentPrices);

// POST /v1/prices/refresh - Manually refresh prices
router.post('/refresh', priceController.refreshPrices);

// POST /v1/prices/seed-history - Seed sample history data (dev only)
router.post('/seed-history', priceController.seedHistory);

// GET /v1/prices/compare - Compare prices
router.get('/compare', priceController.comparePrices);

// GET /v1/prices/codes - Get list of all gold codes
router.get('/codes', priceController.getGoldCodes);

// GET /v1/prices/:code - Get price by code
router.get('/:code', priceController.getPriceByCode);

// GET /v1/prices/:code/history - Get price history
router.get('/:code/history', priceController.getPriceHistory);

// GET /v1/prices/:code/statistics - Get price statistics
router.get('/:code/statistics', priceController.getStatistics);

export default router;
