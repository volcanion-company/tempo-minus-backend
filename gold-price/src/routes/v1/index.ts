import { Router } from 'express';
import priceRoutes from './priceRoutes';
import authRoutes from './authRoutes';
import providerRoutes from './providerRoutes';
import { healthController } from '../../controllers/healthController.js';

const router = Router();

// Mount routes
router.use('/prices', priceRoutes);
router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);

// Health check routes
router.get('/health', healthController.getHealth.bind(healthController));
router.get('/health/live', healthController.getLiveness.bind(healthController));
router.get('/health/ready', healthController.getReadiness.bind(healthController));

export default router;
