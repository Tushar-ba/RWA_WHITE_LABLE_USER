import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { TokenType, CancelRedemptionParams, TOKEN_CONFIGS } from './shared/tokenTypes';

export const useCancelRedemption = (tokenType: TokenType) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const cancelRedemptionRequest = async ({ requestId }: CancelRedemptionParams) => {
    try {
      const tokenConfig = TOKEN_CONFIGS[tokenType];

      if (!tokenConfig.contractAddress) {
        throw new Error(`${tokenType} contract address not found in environment variables`);
      }

      if (!requestId || isNaN(Number(requestId))) {
        throw new Error('Invalid request ID');
      }

      writeContract({
        address: tokenConfig.contractAddress as `0x${string}`,
        abi: tokenConfig.abi,
        functionName: 'cancelRedemptionRequest',
        args: [BigInt(requestId)],
      });

      toast({
        title: t('toasts.redemptionCancellationInitiated', { token: tokenType }),
        description: t('toasts.redemptionCancellationDescription', { requestId, symbol: tokenConfig.symbol }),
      });
    } catch (err: any) {
      console.error(`${tokenType} Redemption Cancellation Error:`, err);

      toast({
        title: t('toasts.redemptionCancellationFailed', { token: tokenType }),
        description: err.message || t('toasts.redemptionCancellationFailedDescription', { token: tokenType }),
        variant: 'destructive',
      });

      throw err;
    }
  };

  return {
    cancelRedemptionRequest,
    isPending,
    isConfirming,
    isConfirmed,
    transactionHash: hash,
    error,
    isLoading: isPending || isConfirming,
  };
};