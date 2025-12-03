import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Query keys for purchase history
export const purchaseHistoryKeys = {
  all: ['purchaseHistory'] as const,
  user: (userId?: string) => [...purchaseHistoryKeys.all, 'user', userId] as const,
  platform: () => [...purchaseHistoryKeys.all, 'platform'] as const,
  paginated: (page: number, limit: number) => [...purchaseHistoryKeys.all, 'paginated', page, limit] as const,
};

// Types for Purchase History
export interface PurchaseHistoryRecord {
  _id: string;
  id: string;
  userId: string;
  metal: 'gold' | 'silver';
  tokenAmount: string;
  usdAmount: string;
  feeAmount: string;
  date: string;
  time: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  networkType: 'canton' | 'public' | 'solana';
  paymentMethod: 'fiat' | 'wallet';
  transactionHash?: string;
  walletAddress: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseHistoryResponse {
  success: boolean;
  message: string;
  data: {
    purchases: PurchaseHistoryRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface PlatformPurchasesResponse {
  success: boolean;
  message: string;
  data: {
    purchases: PurchaseHistoryRecord[];
  };
}

// Fetch user-specific purchase history
export function usePurchaseHistoryQuery(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ["purchasehistory", page],
    queryFn: async (): Promise<PurchaseHistoryResponse> => {
      const response = await apiRequest('GET', `/api/purchase-history?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch purchase history');
      }
      
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Fetch platform purchases (last 10, all users)
export function usePlatformPurchasesQuery() {
  return useQuery({
    queryKey: ["platformpurchase"],
    queryFn: async (): Promise<PlatformPurchasesResponse> => {
      const response = await apiRequest('GET', '/api/purchase-history/platform');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch platform purchases');
      }
      
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}