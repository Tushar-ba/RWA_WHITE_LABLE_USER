import { useState } from 'react';
import axios from 'axios';

interface WalletCheckResponse {
  success: boolean;
  exists: boolean;
  walletAddress: string;
  message: string;
}

interface WalletCheckError {
  success: false;
  message: string;
  errors?: any[];
}

export const useWalletCheck = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWalletExists = async (walletAddress: string): Promise<boolean> => {
    if (!walletAddress || walletAddress.trim().length === 0) {
      setError('Wallet address is required');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<WalletCheckResponse>('/api/wallet-check/check', {
        walletAddress: walletAddress.trim()
      });

      if (response.data.success) {
        return response.data.exists;
      } else {
        setError(response.data.message || 'Failed to check wallet');
        return false;
      }

    } catch (err: any) {
      console.error('Wallet check error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError('Invalid wallet address format');
      } else if (err.response?.status >= 500) {
        setError('Server error while checking wallet');
      } else {
        setError('Unable to check wallet existence');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    checkWalletExists,
    isLoading,
    error,
    clearError
  };
};