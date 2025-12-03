import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { storagePromise } from '../storage/index.js';

/**
 * Middleware to check if user has completed onboarding
 * Returns 403 if user is not onboarded
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const storage = await storagePromise;
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (!user.isOnboarded) {
      return res.status(403).json({
        message: 'Please complete your onboarding to access this resource',
        requiresOnboarding: true
      });
    }

    next();
  } catch (error) {
    console.error('Onboarding middleware error:', error);
    res.status(500).json({
      message: 'Error checking onboarding status'
    });
  }
};

