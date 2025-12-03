import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  TokenType,
  RedemptionRequestParams,
  TOKEN_CONFIGS,
} from "./shared/tokenTypes";

export const useRequestRedemption = (tokenType: TokenType) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const requestRedemption = async ({
    tokenAmount,
    decimals = 18,
  }: RedemptionRequestParams) => {
    try {
      const tokenConfig = TOKEN_CONFIGS[tokenType];
      console.log("Token Config:", tokenConfig);

      if (!tokenConfig.contractAddress) {
        throw new Error(
          `${tokenType} contract address not found in environment variables`,
        );
      }

      if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
        throw new Error("Invalid token amount for redemption");
      }

      const amountInWei = parseUnits(tokenAmount, decimals);

      writeContract({
        address: tokenConfig.contractAddress as `0x${string}`,
        abi: tokenConfig.abi,
        functionName: "requestRedemption",
        args: [amountInWei],
      });

      toast({
        title: t("toasts.redemptionRequestInitiated", { token: tokenType }),
        description: t("toasts.redemptionRequestDescription", {
          quantity: tokenAmount,
          symbol: tokenConfig.symbol,
        }),
      });
    } catch (err: any) {
      console.error(`${tokenType} Redemption Request Error:`, err);

      toast({
        title: t("toasts.redemptionRequestFailed", { token: tokenType }),
        description:
          err.message ||
          t("toasts.redemptionRequestFailedDescription", { token: tokenType }),
        variant: "destructive",
      });

      throw err;
    }
  };

  return {
    requestRedemption,
    isPending,
    isConfirming,
    isConfirmed,
    transactionHash: hash,
    error,
    isLoading: isPending || isConfirming,
  };
};
