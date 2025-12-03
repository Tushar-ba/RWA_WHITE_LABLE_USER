import { useSolanaTokenBalance } from './useSolanaTokenBalance';

export interface SolanaTokenBalances {
  gold: {
    balance: string;
    balanceNumber: number;
    isLoading: boolean;
    error: Error | null;
  };
  silver: {
    balance: string;
    balanceNumber: number;
    isLoading: boolean;
    error: Error | null;
  };
  isLoading: boolean;
  refetch: () => void;
}

export function useSolanaBothTokenBalances(enabled: boolean = true): SolanaTokenBalances {
  // Only fetch balances if enabled
  const {
    balance: goldBalance,
    balanceNumber: goldBalanceNumber,
    isLoading: isLoadingGold,
    error: goldError,
    refetch: refetchGold,
  } = useSolanaTokenBalance('GOLD', enabled);

  const {
    balance: silverBalance,
    balanceNumber: silverBalanceNumber,
    isLoading: isLoadingSilver,
    error: silverError,
    refetch: refetchSilver,
  } = useSolanaTokenBalance('SILVER', enabled);

  const refetch = () => {
    try {
      refetchGold();
      refetchSilver();
    } catch (error) {
      console.warn('Failed to refetch Solana balances:', error);
    }
  };

  return {
    gold: {
      balance: goldBalance,
      balanceNumber: goldBalanceNumber,
      isLoading: isLoadingGold,
      error: goldError,
    },
    silver: {
      balance: silverBalance,
      balanceNumber: silverBalanceNumber,
      isLoading: isLoadingSilver,
      error: silverError,
    },
    isLoading: isLoadingGold || isLoadingSilver,
    refetch,
  };
}