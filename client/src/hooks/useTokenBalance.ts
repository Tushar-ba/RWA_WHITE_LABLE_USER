import { useReadContract } from 'wagmi';
import { formatUnits } from 'ethers';
import { toast } from '@/hooks/use-toast';
import { grtABI } from '../abi/grtABI';
import { srtAbi } from '../abi/srtAbi';
import { ENV } from '@shared/constants';

export type TokenType = 'GOLD' | 'SILVER';

interface BalanceParams {
  account: string;
  decimals?: number;
}

interface TokenConfig {
  contractAddress: string;
  abi: any[];
  name: string;
  symbol: string;
}

// Token configurations object - using documented contract addresses as fallback
const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  GOLD: {
    contractAddress: EVM_GOLD_TOKEN_CONTRACT?.trim() || "0x80252959484b49D90ffe2259b7073FfE2F01C470",
    abi: grtABI,
    name: 'Gold Reserve Token',
    symbol: 'GRT',
  },
  SILVER: {
    contractAddress: EVM_SILVER_TOKEN_CONTRACT?.trim() || "0x3e2cCB6dEA28c251bF882d590A209836495d07D7",
    abi: srtAbi,
    name: 'Silver Reserve Token',
    symbol: 'SRT',
  },
};

export const useTokenBalance = (tokenType: TokenType, { account, decimals = 18 }: BalanceParams) => {
  const tokenConfig = TOKEN_CONFIGS[tokenType];

  const {
    data: balanceData,
    error,
    isLoading,
    refetch,
  } = useReadContract({
    address: tokenConfig.contractAddress as `0x${string}`,
    abi: tokenConfig.abi,
    functionName: 'balanceOf',
    args: [account as `0x${string}`],
    query: {
      enabled: Boolean(account && account.startsWith('0x') && account.length === 42 && tokenConfig.contractAddress),
    },
  });

  // Format balance from Wei to human readable format
  const balance = balanceData ? formatUnits(balanceData as unknown as bigint, decimals) : '0';
  const balanceNumber = parseFloat(balance);

  // Handle errors with user feedback
  if (error) {
    toast({
      title: `${tokenType} Balance Error`,
      description: error.message || `Failed to fetch ${tokenType} balance`,
      variant: 'destructive',
    });
  }

  const getBalance = async () => {
    try {
      if (!tokenConfig.contractAddress) {
        throw new Error(`${tokenType} contract address not found in environment variables`);
      }

      if (!account || !account.startsWith('0x') || account.length !== 42) {
        throw new Error('Invalid account address');
      }

      return await refetch();
    } catch (err: any) {
      console.error(`${tokenType} Balance Error:`, err);

      toast({
        title: `${tokenType} Balance Failed`,
        description: err.message || `Failed to fetch ${tokenType} balance`,
        variant: 'destructive',
      });

      throw err;
    }
  };

  return {
    balance,
    balanceNumber,
    balanceRaw: balanceData as unknown as bigint,
    isLoading,
    error,
    refetch: getBalance,
    tokenConfig,
  };
};