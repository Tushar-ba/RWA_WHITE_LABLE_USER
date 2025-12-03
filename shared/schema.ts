import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Wallet interface for separate collection
export interface Wallet {
  _id?: string;
  userId: string | import('mongodb').ObjectId; // Support both string and ObjectId
  address: string;
  type: string;
  label?: WalletLabel;
  createdAt: Date;
}

// User types and enums
export type TransactionType = 'buy' | 'sell';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type MetalType = 'gold' | 'silver';
export type AccountStatus = 'unverified' | 'verified' | 'suspended';
export type WalletLabel = 'primary' | 'secondary';
export type GiftingStatus = 'completed' | 'failed' | 'pending';
export type RedemptionStatus = 'pending' | 'approved' | 'completed' | 'failed' | 'cancelled';
export type TokenType = 'GOLD' | 'SILVER';
export type NetworkType = 'Ethereum' | 'Solana' | 'Private';
export type PurchaseStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type PaymentMethodType = 'fiat' | 'wallet';

// MongoDB User Document Interface  
export interface User {
  _id?: string;
  email: string;
  password_hash: string;
  username?: string;
  partyId?: string; // Canton party identifier
  account_type?: 'individual' | 'institutional';
  userType?: 'individual' | 'institutional'; // Alias for account_type
  // Individual account fields
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  dob?: string;
  profession?: string;
  // Institutional account fields
  company_name?: string;
  registration_id?: string; // Business registration ID
  company_website?: string;
  company_phone?: string;
  // Business address fields (for institutional)
  business_address1?: string;
  business_address2?: string;
  business_city?: string;
  business_country?: string;
  business_state?: string;
  business_zipcode?: string;
  authorized_signatory_name?: string;
  authorized_signatory_email?: string;
  authorized_signatory_phone?: string;
  // Common fields
  phone_number?: string;
  organization_name?: string; // Legacy field
  address1?: string;
  address2?: string;
  city?: string;
  country: string;
  state?: string; // Optional for backward compatibility
  zipcode?: string;
  account_status: AccountStatus;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  otp_attempts?: number;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_otp_sent?: Date;
  referral_code?: string;
  terms_accepted: boolean;
  last_login?: Date;
  two_factor_enabled: boolean;
  two_factor_token?: string;
  two_factor_expires?: Date;
  
  // KYC fields
  kyc_status: 'not_started' | 'pending' | 'approved' | 'rejected' | 'review';
  kyc_applicant_id?: string;
  kyc_submission_date?: Date;
  kyc_approval_date?: Date;
  kyc_rejection_reason?: string;

  // Onboarding flag
  isOnboarded?: boolean;

  // Account Profile fields (common for both individual and institutional)
  purpose_of_account?: string;
  expected_transaction_activity?: string;
  is_politically_exposed?: boolean;
  
  // FATCA/CRS fields (for individual accounts)
  is_fatca_crs?: boolean;
  tin?: string; // Tax Identification Number

  created_at: Date;
  updated_at: Date;
}

// SystemSettings interface for platform configuration
export interface SystemSettings {
  _id?: string;
  key: string;
  value: {
    percentage?: number;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

// User Profile Update Schema for API validation
export const updateUserProfileSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters").optional(),
  // Individual account fields
  first_name: z.string().trim().min(1, "First name is required").optional(),
  middle_name: z.string().trim().optional(),
  last_name: z.string().trim().min(1, "Last name is required").optional(),
  dob: z.string().trim().optional(),
  // Institutional account fields
  company_name: z.string().trim().optional(),
  company_website: z.union([
    z.string().url("Please enter a valid website URL"),
    z.literal("")
  ]).optional(),
  company_phone: z.string().trim().optional(),
  authorized_signatory_name: z.string().trim().optional(),
  authorized_signatory_email: z.string().email("Please enter a valid email address").optional(),
  authorized_signatory_phone: z.string().trim().optional(),
  // Common fields
  phone_number: z.string().trim().optional(),
  organization_name: z.string().trim().optional(), // Legacy field
  address1: z.string().trim().optional(),
  address2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().min(1, "Country is required").optional(),
  state: z.string().trim().optional(),
  zipcode: z.string().trim().optional(),
  profession: z.string().trim().optional(),
  // KYC fields
  kyc_status: z.enum(['not_started', 'pending', 'review', 'approved', 'rejected']).optional(),
  kyc_applicant_id: z.string().optional(),
  kyc_submission_date: z.string().datetime().optional(),
  kyc_approval_date: z.string().datetime().optional(),
  kyc_rejection_reason: z.string().optional(),
  // Account Profile fields
  purpose_of_account: z.string().trim().optional(),
  expected_transaction_activity: z.string().trim().optional(),
  is_politically_exposed: z.boolean().optional(),
  // FATCA/CRS fields
  is_fatca_crs: z.boolean().optional(),
  tin: z.string().trim().optional(),
});

// Username availability check schema
export const usernameCheckSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(20, "Username must be at most 20 characters"),
});

export type UsernameCheck = z.infer<typeof usernameCheckSchema>;

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// MongoDB Portfolio Document Interface
export interface Portfolio {
  _id?: string;
  userId: string | import('mongodb').ObjectId; // Support both string and ObjectId
  
  totalPortfolioValue: {
    amount: number;
    changePercent: number;
    comparisonPeriod: string;
  };

  goldHoldings: {
    valueUSD: number;
    tokens: number;
    amountSpentUSD: number;
  };

  silverHoldings: {
    valueUSD: number;
    tokens: number;
    amountSpentUSD: number;
  };

  portfolioPerformance: {
    currentValue: number;
    monthlyChangeUSD: number;
    ytdChangePercent: number;
    monthlyChangePercent: number;
    bestMonth: {
      month: string;
      changePercent: number;
    };
  };

  assetAllocation: {
    goldPercent: number;
    silverPercent: number;
  };

  priceTrends: {
    period: string;
    goldPrices: Array<{ date: Date; price: number }>;
    silverPrices: Array<{ date: Date; price: number }>;
  };

  performanceTrendLabel: string;
  lastUpdated: Date;
}

// MongoDB Transaction Document Interface
export interface Transaction {
  _id?: string;
  userId: string | import('mongodb').ObjectId; // Support both string and ObjectId
  type: TransactionType;
  metalType: MetalType;
  amount: string;
  value: string;
  price: string;
  status: TransactionStatus;
  createdAt: Date;
}

// User information structure for expanded user data
export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

// MongoDB Gifting Document Interface
export interface Gifting {
  _id?: string;
  userId: string | import('mongodb').ObjectId; // Sender's user ID - Support both string and ObjectId
  recipientWallet: string; // Recipient wallet address
  token: TokenType; // GOLD or SILVER
  quantity: string; // Amount of tokens
  message?: string; // Optional message
  network: NetworkType; // Ethereum, Solana, or Private
  status: GiftingStatus; // success or failed
  transactionHash?: string; // Blockchain transaction hash (if successful)
  errorMessage?: string; // Error details (if failed)
  networkFee: string; // Network fee in USD
  tokenValueUSD: string; // Token value in USD at time of transfer
  platformFeeUSD: string; // Platform fee in USD
  totalCostUSD: string; // Total cost including fees
  gramsAmount: string; // Physical metal amount in grams
  currentTokenPrice: string; // Current price per token in USD at time of gifting
  notified: boolean; // Whether notification email has been sent for this transaction
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Redemption Document Interface
export interface Redemption {
  _id?: string;
  userId: string | import('mongodb').ObjectId; // User requesting redemption - Support both string and ObjectId
  walletAddress: string; // Wallet address that created the redemption request
  token: TokenType; // GOLD or SILVER
  quantity: string; // Amount of tokens to redeem
  gramsAmount: string; // Physical metal amount in grams
  tokenValueUSD: string; // Token value in USD at time of request
  network: NetworkType; // Ethereum, Solana, or Private
  deliveryAddress: string; // Full delivery address
  streetAddress: string; // Street address
  city: string; // City
  state: string; // State/Province
  zipCode: string; // ZIP/Postal code
  country: string; // Country
  status: RedemptionStatus; // pending, approved, completed, failed, cancelled
  transactionHash?: string; // Blockchain transaction hash (if applicable)
  requestId?: string; // Blockchain request ID from RedemptionRequested event
  errorMessage?: string; // Error details (if failed)
  deliveryFee: string; // Delivery fee in USD
  totalCostUSD: string; // Total cost including delivery fees
  approvedAt?: Date; // When request was approved
  completedAt?: Date; // When delivery was completed
  currentTokenPrice: string; // Current price per token in USD at time of gifting
  // Separate notification tracking for each redemption event type
  notificationStatus?: {
    requestNotified: boolean; // Whether notification email has been sent for redemption request
    processingNotified: boolean; // Whether notification email has been sent for processing
    fulfilledNotified: boolean; // Whether notification email has been sent for fulfillment
    cancelledNotified: boolean; // Whether notification email has been sent for cancellation
  };
  // Legacy field for backward compatibility - will be deprecated
  notified: boolean; // Whether notification email has been sent for this transaction
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Purchase History Document Interface
export interface PurchaseHistory {
  _id?: string;
  userId: string | import('mongodb').ObjectId; // User who made the purchase - Support both string and ObjectId
  metal: 'gold' | 'silver'; // Metal type purchased
  tokenAmount: string; // Amount of tokens received
  usdAmount: string; // USD amount paid
  feeAmount: string; // Platform fee amount
  date: string; // Purchase date
  time: string; // Purchase time
  status: PurchaseStatus; // pending, processing, completed, failed
  networkType: 'canton' | 'public' | 'solana'; // Network type used
  paymentMethod: PaymentMethodType; // fiat or wallet
  transactionHash?: string; // Blockchain transaction hash (if successful)
  walletAddress: string; // Wallet address tokens were minted to
  errorMessage?: string; // Error details (if failed)
  currentTokenPrice: string; // Current price per token in USD at time of purchase
  notified: boolean; // Whether notification email has been sent for this transaction
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Notification Document Interface
export interface Notification {
  _id?: string;
  type: 'purchase' | 'redemption' | 'gifting' | 'system' | 'user' | 'buyToken' | 'redeemToken' | 'transaction' | 'wallet';
  title: string;
  message: string;
  relatedId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  targetAdminId?: string; // Specific admin to notify
  targetRoles?: string[]; // Roles that should receive this notification
  targetPermissions?: string[]; // Permissions that should receive this notification
  createdAt: Date;
  updatedAt: Date;
}

// Notification validation schema
export const insertNotificationSchema = z.object({
  type: z.enum(['purchase', 'redemption', 'gifting', 'system', 'user', 'buyToken', 'redeemToken', 'transaction', 'wallet']),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  relatedId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  isRead: z.boolean().default(false),
  targetAdminId: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  targetPermissions: z.array(z.string()).optional()
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Simplified signup schema - only email, password, confirmPassword
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).*$/, 
      "Password must contain at least 8 characters with letters and numbers"),
  confirm_password: z.string().min(1, "Please confirm your password"),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"]
});

// Onboarding schema
export const onboardingSchema = z.object({
  skip: z.boolean().optional(),
  account_type: z.enum(["individual", "institutional"]).optional(),
  userType: z.enum(["individual", "institutional"]).optional(),
  // Personal info (common for both)
  first_name: z.string().min(1, "First name is required").optional(),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  phone_number: z.string().min(1, "Phone number is required").optional(),
  address1: z.string().min(1, "Address line 1 is required").optional(),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required").optional(),
  country: z.string().min(1, "Country is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  zipcode: z.string().optional(),
  // Individual account fields
  dob: z.string().min(1, "Date of birth is required").optional(),
  profession: z.string().optional(),
  // Institutional account fields
  company_name: z.string().min(1, "Company name is required").optional(),
  registration_id: z.string().min(1, "Business registration ID is required").optional(),
  company_website: z.string().url("Please enter a valid website URL").or(z.literal("")).optional(),
  company_phone: z.string().optional(),
  business_address1: z.string().min(1, "Business address line 1 is required").optional(),
  business_address2: z.string().optional(),
  business_city: z.string().min(1, "Business city is required").optional(),
  business_country: z.string().min(1, "Business country is required").optional(),
  business_state: z.string().min(1, "Business state is required").optional(),
  business_zipcode: z.string().optional(),
  authorized_signatory_name: z.string().min(1, "Authorized signatory name is required").optional(),
  authorized_signatory_email: z.string().email("Please enter a valid email address").optional(),
  authorized_signatory_phone: z.string().min(1, "Authorized signatory phone is required").optional(),
  // Account Profile fields (common for both)
  purpose_of_account: z.string().min(1, "Purpose of account is required").optional(),
  expected_transaction_activity: z.string().min(1, "Expected transaction activity is required").optional(),
  // PEP field for institutional accounts
  is_politically_exposed: z.boolean().optional(),
  // FATCA/CRS fields (for individual accounts)
  is_fatca_crs: z.boolean().optional(),
  tin: z.string().optional(),
}).refine((data) => {
  // Allow skip flag
  if (data.skip === true) return true;
  
  // If no account type, allow partial saves (will be validated on final submission)
  if (!data.account_type) return true;
  
  // For partial saves, only validate that provided fields are valid
  // Don't require all fields to be present - that's checked in the backend
  return true;
}, {
  message: "Please fill in all required fields for your account type"
});

// PostgreSQL table definition removed - using MongoDB for this project

export const verifyEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.coerce.string().refine(val => val.length === 6, {
    message: "OTP must be 6 digits"
  })
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verify2FASchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  otp: z.coerce.string().refine(val => val.length === 6, {
    message: "OTP must be 6 digits"
  })
});

export const insertTransactionSchema = z.object({
  userId: z.union([z.string(), z.any()]), // Support both string and ObjectId
  type: z.enum(['buy', 'sell']),
  metalType: z.enum(['gold', 'silver']),
  amount: z.string(),
  value: z.string(),
  price: z.string()
});

export const userInfoSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "User name is required"),
  email: z.string().email("Valid email is required")
});

export const insertGiftingSchema = z.object({
  userId: z.string().min(1, "User ID is required"), // Must be a valid string ID
  recipientWallet: z.string().optional(),
  token: z.enum(['gold', 'silver']).optional(),
  quantity: z.string().optional(),
  message: z.string().optional(),
  network: z.enum(['public', 'solana', 'canton']).optional(),
  status: z.enum(['completed', 'failed', 'pending']).optional(),
  transactionHash: z.string().min(1, "Transaction hash is required"),
  errorMessage: z.string().optional(),
  networkFee: z.string().optional(),
  tokenValueUSD: z.string().optional(),
  platformFeeUSD: z.string().optional(),
  totalCostUSD: z.string().optional(),
  gramsAmount: z.string().optional(),
  currentTokenPrice: z.string().optional()
});

export const insertRedemptionSchema = z.object({
  userId: z.union([z.string(), z.any()]).refine(val => val, "User ID is required"), // Support both string and ObjectId
  walletAddress: z.string().min(1, "Wallet address is required"), // Wallet address that created the redemption
  token: z.enum(['gold', 'silver']).optional(),
  quantity: z.string().optional(),
  gramsAmount: z.string().optional(),
  tokenValueUSD: z.string().optional(),
  network: z.enum(['public', 'solana', 'canton']).optional(),
  deliveryAddress: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  status: z.enum(['pending', 'approved', 'completed', 'failed', 'cancelled']).optional(),
  transactionHash: z.string().optional(), // Make optional since not all redemptions have transaction hash initially
  requestId: z.string().optional(), // Blockchain request ID from RedemptionRequested event
  errorMessage: z.string().optional(),
  deliveryFee: z.string().optional(),
  totalCostUSD: z.string().optional(),
  currentTokenPrice: z.string().optional() // Current price per token in USD at time of redemption
});

export const insertPurchaseHistorySchema = z.object({
  userId: z.union([z.string(), z.any()]).refine(val => val, "User ID is required"), // Support both string and ObjectId
  metal: z.enum(['gold', 'silver']),
  tokenAmount: z.string(),
  usdAmount: z.string(),
  feeAmount: z.string(),
  date: z.string(),
  time: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  networkType: z.enum(['canton', 'public', 'solana']),
  paymentMethod: z.enum(['fiat', 'wallet']),
  transactionHash: z.string().optional(),
  walletAddress: z.string(),
  errorMessage: z.string().optional(),
  currentTokenPrice: z.string() // Current price per token in USD at time of purchase
});

export const addWalletSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  address: z.string().min(1, "Wallet address is required").regex(/^0x[a-fA-F0-9]{40}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^[a-zA-Z0-9]{44}$/, "Invalid wallet address format"),
  label: z.enum(['primary', 'secondary']).optional()
});

// Type exports for API usage
export type SignupData = z.infer<typeof signupSchema>;
export type OnboardingData = z.infer<typeof onboardingSchema>;
export type VerifyEmailData = z.infer<typeof verifyEmailSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type Verify2FAData = z.infer<typeof verify2FASchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AddWalletData = z.infer<typeof addWalletSchema>;
export type UserInfoType = z.infer<typeof userInfoSchema>;
export type InsertGifting = z.infer<typeof insertGiftingSchema>;
export type InsertRedemption = z.infer<typeof insertRedemptionSchema>;
export type InsertPurchaseHistory = z.infer<typeof insertPurchaseHistorySchema>;

// Contact form schema
export const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters')
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Legacy type compatibility (for existing code)
export type InsertUser = Omit<User, '_id' | 'user_id' | 'password_hash' | 'account_status' | 'email_verified' | 'created_at' | 'updated_at'> & {
  password: string;
};