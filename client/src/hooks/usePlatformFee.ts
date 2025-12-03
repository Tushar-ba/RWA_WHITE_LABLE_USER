import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Platform fee query keys
export const platformFeeKeys = {
  all: ['platform-fee'] as const,
  current: () => [...platformFeeKeys.all, 'current'] as const,
};

export interface PlatformFeeConfig {
  success: boolean;
  message: string;
  data: {
    transferFeePercent: number; // e.g., 2.5 for 2.5%
    minimumFeeUsd: number; // minimum fee in USD
    maximumFeeUsd?: number; // optional maximum fee cap
    lastUpdated: string;
  };
}

// For now, return a static configuration - this can be made dynamic later
export function usePlatformFeeQuery() {
  return useQuery({
    queryKey: platformFeeKeys.current(),
    queryFn: async (): Promise<PlatformFeeConfig> => {
      try {
        // Fetch dynamic platform fee from API
        const response = await fetch('/api/system/platform-fee');
        if (!response.ok) {
          throw new Error('Failed to fetch platform fee');
        }
        
        const apiData = await response.json();
        
        // Extract the percentage from API response and convert to decimal
        const platformFeePercent = apiData.data?.percentage || 0;
        
        return {
          success: true,
          message: 'Platform fee configuration retrieved',
          data: {
            transferFeePercent: platformFeePercent, // Dynamic platform fee from API
            minimumFeeUsd: 5.0, // minimum $5 fee
            maximumFeeUsd: 100.0, // maximum $100 fee cap
            lastUpdated: apiData.data?.updatedAt || new Date().toISOString(),
          }
        };
      } catch (error) {
        console.error('Failed to fetch platform fee, using fallback:', error);
        // Fallback to static value if API fails
        return {
          success: true,
          message: 'Platform fee configuration retrieved (fallback)',
          data: {
            transferFeePercent: 0, // Fallback platform fee
            minimumFeeUsd: 5.0,
            maximumFeeUsd: 100.0,
            lastUpdated: new Date().toISOString(),
          }
        };
      }
    },
    staleTime: 3600000, // 1 hour (fee config changes infrequently)
    refetchInterval: false, // Don't auto-refresh fee config
    refetchOnWindowFocus: false,
  });
}

// Utility function to calculate platform fee
export function calculatePlatformFee(
  tokenValueUsd: number,
  feeConfig: PlatformFeeConfig['data']
): {
  feePercent: number;
  feeAmountUsd: number;
  totalCostUsd: number;
} {
  const feePercent = feeConfig.transferFeePercent;
  let feeAmountUsd = (tokenValueUsd * feePercent) / 100;
  
  // Apply minimum fee
  if (feeAmountUsd < feeConfig.minimumFeeUsd) {
    feeAmountUsd = feeConfig.minimumFeeUsd;
  }
  
  // Apply maximum fee cap if configured
  if (feeConfig.maximumFeeUsd && feeAmountUsd > feeConfig.maximumFeeUsd) {
    feeAmountUsd = feeConfig.maximumFeeUsd;
  }
  
  const totalCostUsd = tokenValueUsd + feeAmountUsd;
  
  return {
    feePercent,
    feeAmountUsd,
    totalCostUsd,
  };
}