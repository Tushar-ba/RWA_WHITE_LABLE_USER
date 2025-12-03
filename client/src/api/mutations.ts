import { axiosRequestUtil } from '@/lib/axios';
import { ENV } from '@shared/constants';

export const createGiftingRecord = (payload: {
  transactionHash: string;
  status: string;
  message?: string;
  recipientWallet?: string;
  tokenType?: string;
  amount?: string;
  network?: string;
  giftingType?: string;
  usdValue?: number;
  currentTokenPrice?: string;
}) => {
  const url = `/api/gifting`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload, 
  });
};

// Auth mutations
export const registerUserOnCanton = (payload: {
  email: string;
  fullName: string;
  role: string;
}) => {
  const baseUrl = CANTON_API_BASE_URL;
  const url = `/api/auth/register`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    baseUrl
  });
};

// Canton RWA API mutations
export const transferTokens = (payload: {
  accountContractId: string;
  recipientParty: string;
  amount: number;
  feeConfigCid: string;
  feePoolCid: string;
}) => {
  const baseUrl = CANTON_API_BASE_URL;
  const url = `/api/rwa/transfer`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    baseUrl
  });
};

export const createRedemption = (payload: {
  accountContractId: string;
  amount: number;
  requestId?: string;
}) => {
  const baseUrl = CANTON_API_BASE_URL;
  const url = `/api/rwa/redemption`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    baseUrl
  });
};

export const cancelRedemption = (payload: {
  redemptionRequestId: string;
  reason: string;
}) => {
  const baseUrl = CANTON_API_BASE_URL;
  const url = `/api/rwa/cancel-redemption`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    baseUrl
  });
};

export const signupUser = (payload: {
  email: string;
  password: string;
  confirm_password: string;
  terms_accepted: boolean;
}) => {
  const url = `/api/auth/signup`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const loginUser = (payload: {
  email: string;
  password: string;
}) => {
  const url = `/api/auth/login`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const verifyEmail = (payload: {
  email: string;
  otp: string;
}) => {
  const url = `/api/auth/verify-email`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const verify2FA = (payload: {
  email: string;
  otp: string;
}) => {
  const url = `/api/auth/verify-2fa`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const resendOTP = (payload: {
  email: string;
  purpose: "email_verification" | "2fa";
}) => {
  const url = `/api/auth/resend-otp`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const forgotPassword = (payload: {
  email: string;
}) => {
  const url = `/api/auth/forgot-password`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const resetPassword = (payload: {
  token: string;
  password: string;
}) => {
  const url = `/api/auth/reset-password`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const updatePassword = (payload: {
  current_password: string;
  new_password: string;
}, token?: string) => {
  const url = `/api/auth/update-password`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    token,
  });
};

// Portfolio mutations
export const buyAsset = (payload: {
  asset_type: string;
  amount: number;
  price_per_unit: number;
}, token?: string) => {
  const url = `/api/portfolio/buy`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    token,
  });
};

export const sellAsset = (payload: {
  asset_type: string;
  amount: number;
  price_per_unit: number;
}, token?: string) => {
  const url = `/api/portfolio/sell`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    token,
  });
};

// Mint tokens mutation
export const mintTokens = (payload: {
  tokenType: string;
  amountInUsd: string;
  walletAddress: string;
}) => {
  const url = `/api/mint/tokens`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

// Wallet management mutations
export const addWallet = (payload: {
  provider: string;
  address: string;
  label?: string;
}, token?: string) => {
  const url = `/api/wallets/add`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
    token,
  });
};

export const createRedemptionRecord = (payload: {
  transactionHash: string;
  deliveryAddress: string;
  status?: string;
  token?: string;
  quantity?: string;
  gramsAmount?: string;
  tokenValueUSD?: string;
  network?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  requestId?: string;
  errorMessage?: string;
  deliveryFee?: string;
  totalCostUSD?: string;
  currentTokenPrice?: string;
}) => {
  const url = `/api/redemptions`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

// Username availability check mutation
export const checkUsernameAvailability = (payload: {
  username: string;
}) => {
  const url = `/api/users/check-username`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

// Canton token allocation mutations
export const allocateParty = (payload: {
  identifierHint: string;
  displayName: string;
}) => {
  const url = `/api/tokens/allocate-party`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

export const createCantonUser = (payload: {
  userId: string;
  primaryParty: string;
  rights: Array<{
    type: string;
    party: string;
  }>;
}) => {
  const url = `/api/tokens/create-user`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};

// Update user with party information
export const updateUserPartyInfo = (payload: {
  username: string;
  partyId: string;
}) => {
  const url = `/api/users/update-party-info`;
  
  return axiosRequestUtil({
    url,
    method: "POST",
    payload,
  });
};