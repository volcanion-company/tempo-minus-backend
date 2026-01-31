import { Router } from 'express';
import { providerController } from '../../controllers/providerController.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Apply rate limiting to all routes
router.use(rateLimiter);

// GET /v1/providers - Get all providers
router.get('/', providerController.getAllProviders);

// POST /v1/providers - Create or update a provider
router.post('/', providerController.upsertProvider);

// POST /v1/providers/bulk - Bulk upsert providers
router.post('/bulk', providerController.bulkUpsertProviders);

// GET /v1/providers/:code - Get provider by code
router.get('/:code', providerController.getByCode);

// DELETE /v1/providers/:code - Delete a provider
router.delete('/:code', providerController.deleteProvider);

export default router;
