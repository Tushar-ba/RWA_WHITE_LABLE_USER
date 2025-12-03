import { axiosRequestUtil } from '@/lib/axios';

// Auth related queries
export const getUserProfile = (token?: string) => {
  const url = `/api/users/me`;
  
  return axiosRequestUtil({
    url,
    method: "GET",
    token,
  });
};

// Example of other potential GET requests
export const getUserPortfolio = (token?: string) => {
  const url = `/api/portfolio`;
  
  return axiosRequestUtil({
    url,
    method: "GET",
    token,
  });
};

export const getTransactionHistory = (token?: string) => {
  const url = `/api/transactions`;
  
  return axiosRequestUtil({
    url,
    method: "GET",
    token,
  });
};

export const getAssetPrices = () => {
  const url = `/api/assets/prices`;
  
  return axiosRequestUtil({
    url,
    method: "GET",
  });
};

// Purchase History queries
export const getPurchaseHistory = (params?: { page?: number; limit?: number }) => {
  const url = `/api/purchase-history`;
  const searchParams = new URLSearchParams();
  
  if (params?.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }
  
  const queryString = searchParams.toString();
  const finalUrl = queryString ? `${url}?${queryString}` : url;
  
  return axiosRequestUtil({
    url: finalUrl,
    method: "GET",
  });
};

// Platform Purchases (all users, last 10 transactions)
export const getPlatformPurchases = () => {
  const url = `/api/purchase-history/platform`;
  
  return axiosRequestUtil({
    url,
    method: "GET",
  });
};