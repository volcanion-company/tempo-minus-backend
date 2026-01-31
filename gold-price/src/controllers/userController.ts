import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import { AuthRequest } from '../middleware/auth';

class UserController {
  /**
   * @swagger
   * /v1/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new user account
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - name
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 6
   *                 example: password123
   *               name:
   *                 type: string
   *                 example: John Doe
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       type: object
   *                       properties:
   *                         accessToken:
   *                           type: string
   *                         refreshToken:
   *                           type: string
   *                         expiresIn:
   *                           type: string
   *       409:
   *         description: Email already registered
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await userService.register(email, password, name);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/auth/login:
   *   post:
   *     summary: Login user
   *     description: Authenticate user and get access tokens
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: password123
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       type: object
   *                       properties:
   *                         accessToken:
   *                           type: string
   *                         refreshToken:
   *                           type: string
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await userService.login(email, password);

      res.json({
        success: true,
        data: {
          user: result.user,
          tokens: result.tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/auth/me:
   *   get:
   *     summary: Get current user profile
   *     description: Get authenticated user's profile information
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.user!.userId);

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUser(req.user!.userId, req.body);

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/auth/profile:
   *   put:
   *     summary: Update user profile
   *     description: Update the authenticated user's profile (name, avatar, preferences)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 50
   *                 description: User's full name
   *                 example: Nguyen Van A
   *               avatar:
   *                 type: string
   *                 description: Avatar URL
   *                 example: https://example.com/avatar.jpg
   *               preferences:
   *                 type: object
   *                 properties:
   *                   language:
   *                     type: string
   *                     enum: [vi, en]
   *                   currency:
   *                     type: string
   *                     enum: [VND, USD]
   *                   darkMode:
   *                     type: boolean
   *                   notifications:
   *                     type: object
   *                     properties:
   *                       push:
   *                         type: boolean
   *                       email:
   *                         type: boolean
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async updateUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, avatar, preferences } = req.body;

      // Only allow updating name, avatar, preferences
      const allowedUpdates: any = {};
      if (name !== undefined) allowedUpdates.name = name;
      if (avatar !== undefined) allowedUpdates.avatar = avatar;
      if (preferences !== undefined) allowedUpdates.preferences = preferences;

      if (Object.keys(allowedUpdates).length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'No valid fields to update. Allowed: name, avatar, preferences',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await userService.updateUser(req.user!.userId, allowedUpdates);

      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await userService.deleteUser(req.user!.userId);

      res.json({
        success: true,
        data: { message: 'Account deleted successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await userService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /v1/auth/password:
   *   put:
   *     summary: Change password
   *     description: Change the authenticated user's password
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *                 description: Current password
   *                 example: oldPassword123
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 minLength: 6
   *                 description: New password (min 6 characters)
   *                 example: newPassword456
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     message:
   *                       type: string
   *                       example: Password changed successfully
   *       401:
   *         description: Current password is incorrect or unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'currentPassword and newPassword are required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await userService.changePassword(req.user!.userId, currentPassword, newPassword);

      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
