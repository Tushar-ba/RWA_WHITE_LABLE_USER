import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Combined transaction interface
export interface CombinedTransaction {
  _id: string;
  type: 'purchase' | 'redemption' | 'gifting';
  subtype: string;
  metal: 'gold' | 'silver';
  amount: string;
  value: string;
  status: string;
  date: Date;
  transactionHash?: string;
  network: string;
  fee: string;
  walletAddress: string;
  details: Record<string, any>;
}

export interface TransactionHistoryResponse {
  success: boolean;
  message: string;
  data: CombinedTransaction[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Query keys for transaction history
export const transactionHistoryKeys = {
  all: ['transaction-history'] as const,
  list: (filters: any) => [...transactionHistoryKeys.all, 'list', filters] as const,
};

// Fetch combined transaction history
export function useTransactionHistoryQuery(options: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  const { page = 1, limit = 20, search, type, status, dateFrom, dateTo } = options;
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  return useQuery({
    queryKey: transactionHistoryKeys.list({ page, limit, search, type, status, dateFrom, dateTo }),
    queryFn: async (): Promise<TransactionHistoryResponse> => {
      const response = await apiRequest('GET', `/api/transaction-history?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch transaction history');
      }
      
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

// Export transaction history
export function exportTransactionHistory(options: {
  format?: 'csv' | 'json';
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}): string {
  const { format = 'csv', type, status, dateFrom, dateTo } = options;
  
  const params = new URLSearchParams();
  params.append('format', format);
  if (type) params.append('type', type);
  if (status) params.append('status', status);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  return `/api/transaction-history/export?${params.toString()}`;
}