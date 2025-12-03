// Simple in-memory rate limiter for OTP requests
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 1) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request should be rate limited
   * @param key - Unique identifier (e.g., email address)
   * @returns Object with allowed status and remaining time
   */
  checkLimit(key: string): { allowed: boolean; remainingTime?: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      // First request from this key
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
        lastRequest: now
      });
      return { allowed: true };
    }

    // Check if window has expired
    if (now >= entry.resetTime) {
      // Reset the window
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
        lastRequest: now
      });
      return { allowed: true };
    }

    // Check if within rate limit
    if (entry.count < this.maxRequests) {
      entry.count++;
      entry.lastRequest = now;
      return { allowed: true };
    }

    // Rate limited - return remaining time in seconds
    const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
    return { 
      allowed: false, 
      remainingTime 
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Global rate limiter instance for OTP requests (1 request per 60 seconds)
export const otpRateLimiter = new RateLimiter(60000, 1);

// Cleanup expired entries every 5 minutes
setInterval(() => {
  otpRateLimiter.cleanup();
}, 5 * 60 * 1000);