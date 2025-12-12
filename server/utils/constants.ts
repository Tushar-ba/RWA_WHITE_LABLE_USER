// Security constants
export const SECURITY = {
  PASSWORD_SALT_ROUNDS: 12,
  JWT_EXPIRES_IN: '1h',
  OTP_LENGTH: 6,
  OTP_EXPIRES_IN_MINUTES: 10,
  MAX_OTP_ATTEMPTS: 5,
} as const;

// Database constants
export const DATABASE = {
  COLLECTIONS: {
    USERS: 'users',
    PORTFOLIOS: 'portfolios',
    TRANSACTIONS: 'transactions',
  },
  INITIAL_USDC_BALANCE: '5000.00',
} as const;

// Email constants
export const EMAIL = {
  SUBJECTS: {
    EMAIL_VERIFICATION: 'Verify your email for Solulab Assets Platform',
    PASSWORD_RESET: 'Reset your Solulab Assets password',
  },
  FROM_NAME: 'Solulab Assets Team',
} as const;

// API Response messages
export const MESSAGES = {
  SUCCESS: {
    SIGNUP: 'Signup successful. Please verify your email using the OTP sent.',
    EMAIL_VERIFIED: 'Email verified successfully.',
    LOGIN: 'Login successful',
    PASSWORD_RESET_SENT: 'If your email is registered, you will receive a password reset link.',
    PASSWORD_RESET: 'Password reset successful',
    PASSWORD_UPDATED: 'Password updated successfully',
    OTP_RESENT: 'New OTP sent successfully',
  },
  ERROR: {
    USER_EXISTS: 'User with this email already exists',
    USER_NOT_FOUND: 'User not found',
    EMAIL_ALREADY_VERIFIED: 'Email is already verified',
    TOO_MANY_ATTEMPTS: 'Too many OTP attempts. Please request a new OTP.',
    INVALID_OTP: 'Invalid OTP',
    OTP_EXPIRED: 'OTP has expired',
    EMAIL_NOT_VERIFIED: 'Please verify your email first',
    INVALID_CREDENTIALS: 'Invalid credentials',
    INVALID_RESET_TOKEN: 'Invalid or expired reset token',
    RESET_TOKEN_EXPIRED: 'Reset token has expired',
    CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
    SAME_PASSWORD: 'New password must be different from current password',
    ACCESS_TOKEN_REQUIRED: 'Access token is required',
    INVALID_TOKEN: 'Invalid or expired token',
    RATE_LIMITED: 'Please wait before requesting another OTP',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
  },
} as const;

// Rate limiting constants
export const RATE_LIMITS = {
  OTP_RESEND_WINDOW_MS: 60000, // 60 seconds
  OTP_MAX_REQUESTS: 1,
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;