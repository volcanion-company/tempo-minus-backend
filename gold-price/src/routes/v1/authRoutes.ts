import { Router } from 'express';
import { userController } from '../../controllers/userController.js';
import { authenticate } from '../../middleware/auth.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Apply rate limiting
router.use(rateLimiter);

// POST /v1/auth/register - Register new user
router.post('/register', userController.register);

// POST /v1/auth/login - Login
router.post('/login', userController.login);

// POST /v1/auth/refresh - Refresh access token
router.post('/refresh', userController.refreshToken);

// GET /v1/auth/me - Get current user profile (protected)
router.get('/me', authenticate, userController.getProfile);

// PATCH /v1/auth/me - Update user profile (protected)
router.patch('/me', authenticate, userController.updateProfile);

// DELETE /v1/auth/me - Delete account (protected)
router.delete('/me', authenticate, userController.deleteAccount);

// PUT /v1/auth/password - Change password (protected)
router.put('/password', authenticate, userController.changePassword);

// PUT /v1/auth/profile - Update user profile (protected)
router.put('/profile', authenticate, userController.updateUserProfile);

export default router;
