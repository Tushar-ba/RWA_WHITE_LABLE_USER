import { useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { type InsertGifting } from '@shared/schema';
import { giftingKeys } from '@/queries/gifting';
import { createGiftingRecord } from '@/api/mutations';

interface UseGiftingReturn {
  createGifting: (data: Omit<InsertGifting, 'userId'>, showToast?: boolean) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGifting(): UseGiftingReturn {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: createGiftingRecord,
  });

  const createGifting = useCallback(async (data: Omit<InsertGifting, 'userId'>, showToast: boolean = true): Promise<boolean> => {
    return new Promise(async (resolve) => {
      // Get current token price based on token type
      const getCurrentTokenPrice = async () => {
        try {
          const response = await apiRequest('GET', '/api/metals/both');
          const result = await response.json();
          
          if (result.success) {
            return data.token === 'GOLD' ? result.goldPrice : result.silverPrice;
          }
          
          // Fallback to default prices if API fails
          return data.token === 'GOLD' ? '108' : '21';
        } catch (error) {
          // Fallback to default prices if API fails
           return data.token === 'GOLD' ? '108' : '21';
        }
      };

      const currentTokenPrice = await getCurrentTokenPrice();

      // Transform data to match the mutation payload structure
      const payload = {
        ...data,       
        giftingType: 'transfer', // API expects giftingType       
        currentTokenPrice: currentTokenPrice, // Add current token price
        status: data.status || 'pending', // Ensure status is always a string
      };

      mutation.mutate(payload, {
        onSuccess: (response) => {
          if (showToast) {
            toast({
              title: t("gifting.giftRecordedSuccessfully"),
              description: t("gifting.giftRecordedSuccessfullyDescription"),
              variant: "default",
              duration: 5000,
            });
          }
          // Invalidate gifting history cache
          queryClient.invalidateQueries({ queryKey: giftingKeys.all });
          resolve(true);
        },
        onError: (error) => {
          if (showToast) {
            toast({
              title: t("gifting.giftRecordingFailed"),
              description: error.message || t("gifting.giftRecordingFailedDescription"),
              variant: "destructive",
              duration: 5000,
            });
          }
          resolve(false);
        },
      });
    });
  }, [mutation, toast]);

  const clearError = useCallback(() => {
    mutation.reset();
  }, [mutation]);

  return {
    createGifting,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
    clearError,
  };
}

// Hook for fetching gifting history with pagination using useQuery
export function useGiftingHistory(page: number = 1, limit: number = 10) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: giftingKeys.history(page, limit),
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/gifting?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || t("gifting.failedToFetchHistory"));
      }
      
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const giftings = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  };

  const refetchGiftings = useCallback(() => {
    refetch();
  }, [refetch]);

  const invalidateGiftings = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: giftingKeys.all });
  }, []);

  return {
    giftings,
    pagination,
    isLoading,
    error: error?.message || null,
    refetchGiftings,
    invalidateGiftings,
  };
}