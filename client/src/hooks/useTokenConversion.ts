import { useQuery } from '@tanstack/react-query';

export interface TokenConversionConfig {
  success: boolean;
  message: string;
  data: {
    gold: {
      mgPerToken: number;
      displayText: string;
    };
    silver: {
      mgPerToken: number;
      displayText: string;
    };
  };
}

// Token conversion query keys
export const tokenConversionKeys = {
  all: ['token-conversion'] as const,
  current: () => [...tokenConversionKeys.all, 'current'] as const,
};

export function useTokenConversionQuery() {
  return useQuery({
    queryKey: tokenConversionKeys.current(),
    queryFn: async (): Promise<TokenConversionConfig> => {
      try {
        const response = await fetch('/api/system/token-conversion');
        if (!response.ok) {
          throw new Error('Failed to fetch token conversion values');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch token conversion values, using fallback:', error);
        // Fallback to default values
        return {
          success: true,
          message: 'Token conversion values retrieved (fallback)',
          data: {
            gold: {
              mgPerToken: 10,
              displayText: '10mg of gold'
            },
            silver: {
              mgPerToken: Number(process.env.SILVER_MG_PER_TOKEN),
              displayText: `${process.env.SILVER_MG_PER_TOKEN}mg of silver`
            }
          }
        };
      }
    },
    staleTime: 3600000, // 1 hour (conversion config changes infrequently)
    refetchInterval: false, // Don't auto-refresh conversion config
    refetchOnWindowFocus: false,
  });
}

// Utility function to calculate token amount based on USD and token conversion
export function calculateTokenAmount(
  usdAmount: number,
  pricePerGram: number,
  mgPerToken: number
): number {
  // Price per mg = price per gram / 1000
  const pricePerMg = pricePerGram / 1000;
  
  // Price per token = price per mg * mg per token
  const pricePerToken = pricePerMg * mgPerToken;
  
  // Token amount = USD amount / price per token
  return usdAmount / pricePerToken;
}