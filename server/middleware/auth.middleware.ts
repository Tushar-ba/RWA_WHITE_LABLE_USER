import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../services/jwt.service';

// Extended Request interface to include authenticated user
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

/**
 * Middleware to verify JWT token and authenticate user
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        message: 'Access token is required'
      });
    }

    const payload = JWTService.verifyToken(token);
    if (!payload) {
      console.error('[Auth] Token verification failed for token:', token ? token.substring(0, 20) + '...' : 'null');
      return res.status(401).json({
        message: 'Invalid or expired token'
      });
    }

    console.log('[Auth] JWT payload extracted:', { user_id: payload.user_id, email: payload.email });

    // Attach user data to request object
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      message: 'Authentication error'
    });
  }
};