import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createRedemptionRecord } from '@/api/mutations';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useCallback } from 'react';
import { InsertRedemption } from '@/../../shared/schema';

export const useRedemption = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Enhanced redemption creation with automatic token price fetching
  const createRedemption = useCallback(async (data: Omit<InsertRedemption, 'userId'>, showToast: boolean = true): Promise<boolean> => {
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
          return data.token === 'GOLD' ? '108' : '30.89';
        } catch (error) {
          // Fallback to default prices if API fails
          return data.token === 'GOLD' ? '108' : '30.89';
        }
      };

      const currentTokenPrice = await getCurrentTokenPrice();

      // Transform data to include current token price and ensure required fields
      const payload = {
        transactionHash: data.transactionHash || '',
        deliveryAddress: data.deliveryAddress || '',
        status: data.status || 'pending',
        token: data.token,
        quantity: data.quantity,
        gramsAmount: data.gramsAmount,
        tokenValueUSD: data.tokenValueUSD,
        network: data.network,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        requestId: data.requestId,
        errorMessage: data.errorMessage,
        deliveryFee: data.deliveryFee,
        totalCostUSD: data.totalCostUSD,
        currentTokenPrice: currentTokenPrice,
        walletAddress: data.walletAddress || '' // Add wallet address to payload
      };

      try {
        await createRedemptionRecord(payload);        
        if (showToast) {
          toast({
            title: t("redemption.successTitle"),
            description: t("redemption.successDescription"),
          });
        }
        
        // Invalidate redemption queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/redemptions'] });
        resolve(true);
      } catch (error: any) {
        console.error('Create redemption error:', error);
        
        if (showToast) {
          toast({
            title: t("common.error"),
            description: error.response?.data?.message || t("redemption.createFailedDescription"),
            variant: "destructive",
          });
        }
        
        resolve(false);
      }
    });
  }, [toast, queryClient]);

  // Legacy mutation for backward compatibility
  const legacyCreateRedemption = useMutation({
    mutationFn: createRedemptionRecord,
    onSuccess: (data) => {
      toast({
        title: t("redemption.successTitle"),
        description: t("redemption.successDescription"),
      });
      // Invalidate redemption queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/redemptions'] });
    },
    onError: (error: any) => {
      console.error('Create redemption error:', error);
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("redemption.createFailedDescription"),
        variant: "destructive",
      });
    },
  });

  // Update redemption functionality
  const updateRedemption = useCallback(async (redemptionId: string, updates: Partial<InsertRedemption>, walletAddress?: string): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        const response = await apiRequest('PUT', `/api/redemptions/${redemptionId}`, {
          ...updates,
          walletAddress // Pass wallet address in request body
        });
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: t("common.success"),
            description: t("redemption.updateSuccess"),
          });
          
          // Invalidate redemption queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/redemptions'] });
          resolve(true);
        } else {
          throw new Error(result.message || t("redemption.updateError"));
        }
      } catch (error: any) {
        console.error('Update redemption error:', error);
        
        toast({
          title: t("common.error"),
          description: error.message || t("redemption.updateError"),
          variant: "destructive",
        });
        resolve(false);
      }
    });
  }, [toast, t, queryClient]);

  // Cancel redemption functionality (legacy - will be removed)
  const cancelRedemption = useCallback(async (redemptionId: string, walletAddress?: string): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        const response = await apiRequest('DELETE', `/api/redemptions/${redemptionId}`, {
          walletAddress // Pass wallet address in request body
        });
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: t("common.success"),
            description: t("redemption.cancelSuccess"),
          });
          
          // Invalidate redemption queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/redemptions'] });
          resolve(true);
        } else {
          throw new Error(result.message || t("redemption.cancelError"));
        }
      } catch (error: any) {
        console.error('Cancel redemption error:', error);
        
        toast({
          title: t("common.error"),
          description: error.message || t("redemption.cancelError"),
          variant: "destructive",
        });
        resolve(false);
      }
    });
  }, [toast, t, queryClient]);

  return {
    createRedemption,
    updateRedemption,
    cancelRedemption,
    legacyCreateRedemption
  };
};

export const useRedemptionHistory = (page: number = 1, limit: number = 10) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/redemptions', { page, limit }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/redemptions?page=${page}&limit=${limit}`);
      const data = await response.json();
      return {
        redemptions: data.redemptions || [],
        pagination: data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    },
  });

  const refetchRedemptions = useCallback(() => {
    refetch();
  }, [refetch]);

  const invalidateRedemptions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/redemptions'] });
  }, []);

  return {
    data,
    isLoading,
    error: error?.message || null,
    refetchRedemptions,
    invalidateRedemptions,
  };
};