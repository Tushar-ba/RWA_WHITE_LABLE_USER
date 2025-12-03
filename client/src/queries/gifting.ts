import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { type InsertGifting, type Gifting } from '@shared/schema';

// Query keys for gifting operations
export const giftingKeys = {
  all: ['gifting'] as const,
  history: (page: number, limit: number) => [...giftingKeys.all, 'history', page, limit] as const,
};

// Create gifting mutation
export function useCreateGiftingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<InsertGifting, 'userId'>) => {
      const response = await apiRequest('POST', '/api/gifting', data);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create gifting record');
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch gifting history
      queryClient.invalidateQueries({ queryKey: giftingKeys.all });
    },
  });
}

// Fetch gifting history query
export function useGiftingHistoryQuery(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: giftingKeys.history(page, limit),
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/gifting?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch gifting history');
      }
      
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}