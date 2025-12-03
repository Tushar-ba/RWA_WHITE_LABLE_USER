import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "ethers";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { grtABI } from "../abi/grtABI";
import { srtAbi } from "../abi/srtAbi";
import { ENV } from "@shared/constants";

export type TokenType = "GOLD" | "SILVER";

interface TransferParams {
  to: string;
  amount: string;
  decimals?: number;
}

interface TokenConfig {
  contractAddress: string;
  abi: any[];
  name: string;
  symbol: string;
}

// Token configurations object
const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  GOLD: {
    contractAddress: EVM_GOLD_TOKEN_CONTRACT || "",
    abi: grtABI,
    name: "Gold Reserve Token",
    symbol: "GRT",
  },
  SILVER: {
    contractAddress: EVM_SILVER_TOKEN_CONTRACT || "",
    abi: srtAbi,
    name: "Silver Reserve Token",
    symbol: "SRT",
  },
};

export const useTokenTransfer = (tokenType: TokenType) => {
  console.log(tokenType,"tokenType")
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { t } = useTranslation();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const transfer = async ({ to, amount, decimals = 18 }: TransferParams) => {
    try {
      const tokenConfig = TOKEN_CONFIGS[tokenType];

      if (!tokenConfig.contractAddress) {
        throw new Error(
          `${tokenType} contract address not found in environment variables`,
        );
      }

      if (!to || !to.startsWith("0x") || to.length !== 42) {
        throw new Error("Invalid recipient address");
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Invalid transfer amount");
      }

      const amountInWei = parseUnits(amount, decimals);

      writeContract({
        address: tokenConfig.contractAddress as `0x${string}`,
        abi: tokenConfig.abi,
        functionName: "transfer",
        args: [to as `0x${string}`, amountInWei],
      });

      toast({
        title: t("toasts.transferInitiated", { token: tokenType }),
        description: t("toasts.transferringTokens", {
          amount,
          symbol: tokenConfig.symbol,
          address: `${to.slice(0, 6)}...${to.slice(-4)}`,
        }),
      });
    } catch (err: any) {
      console.error(`${tokenType} Transfer Error:`, err);

      toast({
        title: t("toasts.transferFailed", { token: tokenType }),
        description: err.message,
        variant: "destructive",
      });

      throw err;
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast({
        title: t("toasts.transferSuccessful", { token: tokenType }),
        description: t("toasts.transferSuccessfulDesc", {
          token: tokenType,
          hash: hash.slice(0, 10),
        }),
        duration: 5000,
      });
    }
  }, [isConfirmed, hash, tokenType, toast]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      toast({
        title: t("toasts.transactionError", { token: tokenType }),
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, tokenType, toast]);

  return {
    transfer,
    isPending,
    isConfirming,
    isConfirmed,
    transactionHash: hash,
    error,
    isLoading: isPending || isConfirming,
  };
};
