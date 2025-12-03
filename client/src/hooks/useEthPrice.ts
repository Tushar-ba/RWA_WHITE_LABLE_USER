import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// ETH price query keys
export const ethPriceKeys = {
  all: ['eth-price'] as const,
  price: () => [...ethPriceKeys.all, 'current'] as const,
};

export interface EthPriceResponse {
  success: boolean;
  message: string;
  data: {
    price: number;
    currency: string;
    timestamp: string;
    source: string;
  };
}

export function useEthPriceQuery() {
  return useQuery({
    queryKey: ethPriceKeys.price(),
    queryFn: async (): Promise<EthPriceResponse> => {
      const response = await apiRequest('GET', '/api/prices/ethereum');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch ETH price');
      }
      
      return result;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}