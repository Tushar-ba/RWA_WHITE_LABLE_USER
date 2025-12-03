export class OTPService {
  /**
   * Generate a 6-digit OTP code
   * @returns 6-digit numeric string
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get OTP expiration time (10 minutes from now)
   * @returns Date object representing expiration time
   */
  static getOTPExpiration(): Date {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 10);
    return expiration;
  }

  /**
   * Check if OTP has expired
   * @param expirationDate - OTP expiration date
   * @returns True if expired, false otherwise
   */
  static isOTPExpired(expirationDate: Date | undefined): boolean {
    if (!expirationDate) return true;
    return new Date() > expirationDate;
  }

  /**
   * Validate OTP format
   * @param otp - OTP string to validate
   * @returns True if valid 6-digit format
   */
  static isValidOTPFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}