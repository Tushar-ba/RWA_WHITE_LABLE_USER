import jwt from 'jsonwebtoken';
import { ENV } from '@shared/constants';

export interface JWTPayload {
  user_id: string;
  email: string;
}

export interface ResetTokenPayload {
  user_id: string;
  email: string;
  type: 'password_reset';
}

export class JWTService {
  private static getSecret(): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET must be defined in environment variables");
    }
    return jwtSecret;
  }

  /**
   * Generate JWT token with user payload
   * @param payload - User data to include in token
   * @param expiresIn - Token expiration time (default: 24h)
   * @returns Signed JWT token
   */
  static generateToken(payload: JWTPayload, expiresIn: string = '24h'): string {
    return jwt.sign(payload, this.getSecret(), { expiresIn } as jwt.SignOptions);
  }

  /**
   * Verify JWT token and extract payload
   * @param token - JWT token to verify
   * @returns Decoded payload or null if invalid
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      if (!token || typeof token !== 'string') {
        console.error('JWT verification failed: Token is null, undefined, or not a string');
        return null;
      }
      
      // Remove Bearer prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
      
      if (!cleanToken) {
        console.error('JWT verification failed: Empty token after cleaning');
        return null;
      }

      return jwt.verify(cleanToken, this.getSecret()) as JWTPayload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Generate password reset token
   * @param payload - Reset token payload
   * @param expiresIn - Token expiration time (default: 1h)
   * @returns Signed reset token
   */
  static generateResetToken(payload: ResetTokenPayload, expiresIn: string = '1h'): string {
    return jwt.sign(payload, this.getSecret(), { expiresIn } as jwt.SignOptions);
  }

  /**
   * Verify password reset token
   * @param token - Reset token to verify
   * @returns Decoded payload or null if invalid
   */
  static verifyResetToken(token: string): ResetTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.getSecret()) as any;
      if (payload.type === 'password_reset') {
        return payload as ResetTokenPayload;
      }
      return null;
    } catch (error) {
      console.error('Reset token verification failed:', error);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - Authorization header value
   * @returns Token string or null
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}