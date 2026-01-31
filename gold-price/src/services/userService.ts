import { User, IUser } from '../models';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

// Workaround for @types/jsonwebtoken StringValue branded type issue
// See: https://github.com/auth0/node-jsonwebtoken/issues/893
const signToken = (payload: object, secret: string, expiresIn: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn } as any);
};

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

class UserService {
  async register(email: string, password: string, name: string): Promise<{ user: any; tokens: any }> {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        name,
      });

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Remove password from response
      const { password: _, ...userObject } = user.toObject();

      logger.info(`User registered: ${email}`);

      return { user: userObject, tokens };
    } catch (error) {
      logger.error('Register error:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: any; tokens: any }> {
    try {
      // Find user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Remove password from response
      const { password: _, ...userObject } = user.toObject();

      logger.info(`User logged in: ${email}`);

      return { user: userObject, tokens };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Get user by ID error:', { userId, error });
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<IUser>): Promise<IUser> {
    try {
      // Don't allow updating sensitive fields
      const { password, email, role, isPremium, premiumExpiry, ...allowedUpdates } = updates as any;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: allowedUpdates },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new NotFoundError('User not found');
      }

      logger.info(`User updated: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Update user error:', { userId, error });
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      logger.info(`User deleted: ${user.email}`);
    } catch (error) {
      logger.error('Delete user error:', { userId, error });
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Find user with password
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new UnauthorizedError('New password must be at least 6 characters');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', { userId, error });
      throw error;
    }
  }

  generateTokens(user: IUser) {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = signToken(payload, config.jwt.accessSecret, config.jwt.accessExpiry);
    const refreshToken = signToken({ userId: user._id.toString() }, config.jwt.refreshSecret, config.jwt.refreshExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.accessExpiry,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const payload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = signToken(payload, config.jwt.accessSecret, config.jwt.accessExpiry);

      return { accessToken };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new UnauthorizedError('Invalid refresh token');
    }
  }
}

export const userService = new UserService();
