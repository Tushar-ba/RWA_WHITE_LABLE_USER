import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useTokenBalance } from './useTokenBalance';
import { useSolanaTokenBalance } from './useSolanaTokenBalance';

export type NetworkType = 'ethereum' | 'solana' | 'canton';
export type TokenType = 'GOLD' | 'SILVER';

interface NetworkAwareTokenBalanceReturn {
  balance: string;
  balanceNumber: number;
  isLoading: boolean;
  error: any;
  network: NetworkType;
  refetch: () => void;
}

/**
 * Network-aware token balance hook that determines the active network
 * and fetches balance accordingly, preventing React hooks order issues
 */
export function useNetworkAwareTokenBalance(tokenType: TokenType): NetworkAwareTokenBalanceReturn {
  const { address, isConnected } = useAppKitAccount();
  const [networkType, setNetworkType] = useState<NetworkType>('ethereum');

  // Determine network type based on address format and connection
  useEffect(() => {
    if (!isConnected || !address) {
      setNetworkType('ethereum'); // Default
      return;
    }

    if (address.startsWith('0x')) {
      // Ethereum address format
      setNetworkType('ethereum');
    } else if (address.length >= 32 && address.length <= 44) {
      // Solana address format (base58)
      setNetworkType('solana');
    } else {
      // Fallback to ethereum
      setNetworkType('ethereum');
    }
  }, [address, isConnected]);

  // Always call both hooks but conditionally enable them
  const ethereumBalance = useTokenBalance(tokenType, { 
    account: address || '',
    decimals: 18 
  });

  const solanaBalance = useSolanaTokenBalance(tokenType, networkType === 'solana' && isConnected);

  // Return the appropriate balance based on network type - simplified to avoid proxy issues
  const balance = !isConnected 
    ? '0' 
    : networkType === 'solana' 
      ? solanaBalance?.balance || '0'
      : ethereumBalance?.balance || '0';

  const balanceNumber = !isConnected 
    ? 0 
    : networkType === 'solana' 
      ? solanaBalance?.balanceNumber || 0
      : ethereumBalance?.balanceNumber || 0;

  const isLoading = !isConnected 
    ? false 
    : networkType === 'solana' 
      ? solanaBalance?.isLoading || false
      : ethereumBalance?.isLoading || false;

  const error = !isConnected 
    ? null 
    : networkType === 'solana' 
      ? solanaBalance?.error || null
      : ethereumBalance?.error || null;

  const refetch = !isConnected 
    ? () => {} 
    : networkType === 'solana' 
      ? solanaBalance?.refetch || (() => {})
      : ethereumBalance?.refetch || (() => {});

  return {
    balance,
    balanceNumber,
    isLoading,
    error,
    network: networkType,
    refetch
  };
}

/**
 * Legacy hook wrapper for backwards compatibility
 */
export function useTokenBalanceCompat(tokenType: TokenType, params: { account: string }) {
  return useNetworkAwareTokenBalance(tokenType);
}