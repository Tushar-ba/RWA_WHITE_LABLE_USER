import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Portfolio interface matching new API response
export interface PortfolioData {
  _id: string;
  userId: string;
  totalPortfolioValue: {
    amount: number;
  };
  goldHoldings: {
    valueUSD: number;
    tokens: number;
  };
  silverHoldings: {
    valueUSD: number;
    tokens: number;
  };
  assetAllocation: {
    goldPercent: number;
    silverPercent: number;
  };
  portfolio: Array<{
    date: string;
    value: number;
    change: number;
  }>;
  dailyPortfolio?: Array<{
    date: string;
    value: number;
    change: number;
  }>;
  lastUpdated: string | Date;
}

export interface PortfolioResponse {
  message: string;
  portfolio: PortfolioData;
}

// Query keys for portfolio
export const portfolioKeys = {
  all: ['portfolio'] as const,
  user: (userId?: string) => [...portfolioKeys.all, 'user', userId] as const,
};

// Fetch user's portfolio
export function usePortfolioQuery() {
  return useQuery({
    queryKey: portfolioKeys.all,
    queryFn: async (): Promise<PortfolioResponse> => {
      const response = await apiRequest('GET', '/api/portfolio');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch portfolio');
      }
      
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}