import { Request, Response, NextFunction } from 'express';
import { storagePromise } from '../storage/index.js';
import { Logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
  };
}

/**
 * Middleware to check if user has completed KYC
 * Blocks access to protected endpoints if KYC is not approved
 */
export const requireKycApproval = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id: userId } = req.user!;
    const storage = await storagePromise;

    const user = await storage.getUser(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check KYC status
    if (user.kyc_status !== 'approved') {
      res.status(403).json({
        success: false,
        message: 'KYC verification required',
        kycStatus: user.kyc_status,
        requiresKyc: true
      });
      return;
    }

    next();
  } catch (error: any) {
    Logger.error('Error checking KYC status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify KYC status',
      error: error.message
    });
  }
};

/**
 * Middleware to check KYC status and add to request
 * Does not block access but provides KYC information
 */
export const checkKycStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { user_id: userId } = req.user!;
    const storage = await storagePromise;

    const user = await storage.getUser(userId);
    if (user) {
      // Add KYC status to request object
      (req as any).kycStatus = user.kyc_status;
      (req as any).kycApproved = user.kyc_status === 'approved';
    }

    next();
  } catch (error: any) {
    Logger.error('Error checking KYC status:', error);
    // Don't block request, just log error and continue
    next();
  }
};