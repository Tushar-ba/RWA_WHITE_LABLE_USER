import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Query keys for market prices
export const marketPricesKeys = {
  all: ['marketPrices'] as const,
  gold: () => [...marketPricesKeys.all, 'gold'] as const,
  silver: () => [...marketPricesKeys.all, 'silver'] as const,
  both: () => [...marketPricesKeys.all, 'both'] as const,
};

// Types for Gold API response
export interface GoldApiPrice {
  price: number;
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_21k: number;
  price_gram_20k: number;
  price_gram_18k: number;
  price_gram_16k: number;
  price_gram_14k: number;
  price_gram_10k: number;
  change: number;
  timestamp: number;
  metal: string;
  currency: string;
  exchange: string;
  symbol: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Fetch gold price
export function useGoldPriceQuery() {
  return useQuery({
    queryKey: marketPricesKeys.gold(),
    queryFn: async (): Promise<ApiResponse<GoldApiPrice>> => {
      const response = await apiRequest('GET', '/api/metals/gold');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch gold price');
      }
      
      return result;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Fetch silver price
export function useSilverPriceQuery() {
  return useQuery({
    queryKey: marketPricesKeys.silver(),
    queryFn: async (): Promise<ApiResponse<GoldApiPrice>> => {
      const response = await apiRequest('GET', '/api/metals/silver');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch silver price');
      }
      
      return result;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Fetch both gold and silver prices
export function useBothPricesQuery() {
  return useQuery({
    queryKey: marketPricesKeys.both(),
    queryFn: async (): Promise<ApiResponse<{ gold: GoldApiPrice; silver: GoldApiPrice }>> => {
      const response = await apiRequest('GET', '/api/metals/both');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch market prices');
      }
      
      return result;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}