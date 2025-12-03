import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  Gift,
  Clock,
  ArrowUpRight,
  Share2,
  Shield,
  Globe,
  Info,
  X,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useTokenTransfer, type TokenType } from "@/hooks/useTokenTransfer";
import {
  useSolanaTokenTransfer,
  type SolanaTokenType,
} from "@/hooks/useSolanaTokenTransfer";
import { useSolanaTokenBalance } from "@/hooks/useSolanaTokenBalance";
import { useWalletCheck } from "@/hooks/useWalletCheck";
import { useGifting, useGiftingHistory } from "@/hooks/useGifting";
import { useBothPricesQuery } from "@/queries/marketPrices";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/hooks/use-toast";
import QrScanner from "qr-scanner";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transferTokens } from "@/api/mutations";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { giftingKeys } from "@/queries/gifting";
import { ENV } from "@shared/constants";

export default function GiftingTransfer() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const successLoggedRef = useRef<string | null>(null);

  const [form, setForm] = useState({
    wallet: "",
    token: "gold",
    quantity: "",
    message: "",
    network: "public",
  });

  const [walletValidation, setWalletValidation] = useState({
    isChecked: false,
    exists: false,
    isValidating: false,
  });

  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isPrivateTransferLoading, setIsPrivateTransferLoading] =
    useState(false);

  // Hooks
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");

  // Define wallet provider interface for proper typing
  interface SolanaWalletProvider {
    publicKey?: {
      toString(): string;
    };
  }
  const typedWalletProvider = walletProvider as SolanaWalletProvider | null;
  const {
    transfer: tokenTransferFn,
    isPending,
    isConfirming,
    isConfirmed: isTokenConfirmed,
    transactionHash: tokenHash,
    error: tokenTransferError,
    isLoading: isTokenTransferLoading,
  } = useTokenTransfer(form?.token?.toUpperCase() as TokenType);

  // Solana token transfer hook
  const {
    transfer: solanaTransferFn,
    isPending: isSolanaPending,
    isConfirming: isSolanaConfirming,
    isConfirmed: isSolanaConfirmed,
    transactionHash: solanaHash,
    error: solanaTransferError,
    isLoading: isSolanaLoading,
  } = useSolanaTokenTransfer(form?.token?.toUpperCase() as SolanaTokenType);

  const {
    checkWalletExists,
    isLoading: isCheckingWallet,
    error: walletCheckError,
    clearError: clearWalletError,
  } = useWalletCheck();

  const {
    createGifting,
    isLoading: isCreatingGifting,
    error: giftingError,
    clearError: clearGiftingError,
  } = useGifting();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);

  const {
    giftings,
    pagination,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useGiftingHistory(currentPage, pageLimit);

  const {
    data: pricesData,
    isLoading: isPricesLoading,
    error: pricesError,
  } = useBothPricesQuery();

  // Stable network detection - only changes when network actually changes
  const currentNetwork = useMemo(() => {
    return form.network === "solana" ? "Solana" : "Ethereum";
  }, [form.network]);

  // Remove continuous balance fetching - will check on demand when gift button is clicked

  // Token values with real-time pricing
  // Get conversion rates from environment (default: 10mg per token)
  const goldMgPerToken = parseFloat(GOLD_MG_PER_TOKEN || "10");
  const silverMgPerToken = parseFloat(SILVER_MG_PER_TOKEN || "10");

  const tokenValues = useMemo(() => {
    if (!pricesData?.data) {
      return {
        GOLD: {
          name: "Gold",
          pricePerGram: 108, // fallback price per gram
          mgPerToken: goldMgPerToken,
          pricePerToken: (108 * goldMgPerToken) / 1000, // convert mg to grams for pricing
        },
        SILVER: {
          name: "Silver",
          pricePerGram: 1.4, // fallback price per gram
          mgPerToken: silverMgPerToken,
          pricePerToken: (1.4 * silverMgPerToken) / 1000, // convert mg to grams for pricing
        },
      };
    }

    const goldPricePerGram = parseFloat(
      String(pricesData.data.gold?.price_gram_24k || "108"),
    );
    const silverPricePerGram = parseFloat(
      String(pricesData.data.silver?.price_gram_24k || "31"),
    );

    return {
      GOLD: {
        name: "Gold",
        pricePerGram: goldPricePerGram,
        mgPerToken: goldMgPerToken,
        pricePerToken: (goldPricePerGram * goldMgPerToken) / 1000, // convert mg to grams for pricing
      },
      SILVER: {
        name: "Silver",
        pricePerGram: silverPricePerGram,
        mgPerToken: silverMgPerToken,
        pricePerToken: (silverPricePerGram * silverMgPerToken) / 1000, // convert mg to grams for pricing
      },
    };
  }, [pricesData, goldMgPerToken, silverMgPerToken]);

  // Simplified calculations
  const calculations = useMemo(() => {
    const quantity = Number(form.quantity);
    if (!quantity || quantity <= 0) {
      return {
        milligramsAmount: 0,
        gramsAmount: 0,
        tokenValueUSD: 0,
        totalCostUSD: 0,
      };
    }

    const tokenInfo =
      tokenValues[form.token?.toUpperCase() as keyof typeof tokenValues];

    const milligramsAmount = quantity * tokenInfo?.mgPerToken; // tokens * mg per token
    const gramsAmount = milligramsAmount / 1000; // convert mg to grams for display
    const tokenValueUSD = quantity * tokenInfo.pricePerToken;
    const totalCostUSD = tokenValueUSD; // Total cost is just the token value, no platform fee

    return {
      milligramsAmount,
      gramsAmount,
      tokenValueUSD,
      totalCostUSD,
    };
  }, [form.quantity, form.token, tokenValues]);

  // Pagination functions
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.totalPages) {
        setCurrentPage(page);
      }
    },
    [pagination.totalPages],
  );

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  }, [pagination.hasNext, currentPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  }, [pagination.hasPrev, currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(pagination.totalPages);
  }, [pagination.totalPages]);

  // Add missing stopQrScanner function
  const stopQrScanner = useCallback(() => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setShowQrScanner(false);
    setScanError("");
  }, []);

  // Canton transfer token mutation
  const transferTokensMutation = useMutation({
    mutationFn: transferTokens,
    onSuccess: async (response) => {
      console.log("Canton transfer success:", response);

      // Create gifting record after successful Canton transfer
      try {
        const giftingData = {
          recipientWallet: form.wallet,
          token: form.token.toLowerCase() as "gold" | "silver",
          quantity: form.quantity,
          message: form.message || undefined,
          network:
            form.network === "Private"
              ? ("canton" as const)
              : form.network === "Ethernet"
                ? ("public" as const)
                : ("solana" as const),
          status: "completed" as const,
          transactionHash: `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tokenValueUSD: calculations.tokenValueUSD.toString(),
          platformFeeUSD: "0",
          totalCostUSD: calculations.totalCostUSD.toString(),
          gramsAmount: calculations.gramsAmount.toString(),
          currentTokenPrice:
            form.token.toUpperCase() === "GOLD"
              ? String(pricesData?.data?.gold?.price_gram_24k || "108")
              : String(pricesData?.data?.silver?.price_gram_24k || "31"),
        };

        console.log(
          "Creating gifting record for Canton transfer:",
          giftingData,
        );
        const success = await createGifting(giftingData, false);

        if (success) {
          toast({
            title: t("gifting.giftSentSuccessfullyTitle"),
            description: t("gifting.giftSentSuccessfullyDescription", {
              quantity: form.quantity,
              token: form.token,
            }),
            duration: 5000,
          });

          // Invalidate gifting history to refresh the list
          queryClient.invalidateQueries({ queryKey: giftingKeys.all });

          // Reset form
          setForm({
            ...form,
            quantity: "",
            wallet: "",
            message: "",
            network: "Ethereum",
          });
        }
      } catch (error) {
        console.error("Failed to create gifting record:", error);
        toast({
          title: t("gifting.transferCompleted"),
          description: t("gifting.transferCompletedDescription"),
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Canton transfer failed:", error);
      toast({
        title: t("gifting.cantonTransferFailed"),
        description:
          error?.message || t("gifting.cantonTransferFailedDescription"),
        variant: "destructive",
      });
    },
  });

  // Handle successful transfer
  useEffect(() => {
    if (
      isTokenConfirmed &&
      tokenHash &&
      !showSuccessPopup &&
      successLoggedRef.current !== tokenHash
    ) {
      setShowSuccessPopup(true);
      successLoggedRef.current = tokenHash;

      const logSuccessfulGifting = async () => {
        try {
          const giftingData = {
            recipientWallet: form.wallet,
            token: form.token.toLowerCase() as "gold" | "silver",
            quantity: form.quantity,
            message: form.message || undefined,
            network:
              form.network === "Private"
                ? ("canton" as const)
                : form.network === "Ethereum"
                  ? ("public" as const)
                  : ("solana" as const),
            status: "completed" as const,
            transactionHash: tokenHash,
            tokenValueUSD: calculations.tokenValueUSD.toString(),
            platformFeeUSD: "0",
            totalCostUSD: calculations.totalCostUSD.toString(),
            gramsAmount: calculations.gramsAmount.toString(),
            currentTokenPrice:
              form.token.toUpperCase() === "GOLD"
                ? String(pricesData?.data?.gold?.price_gram_24k || "108")
                : String(pricesData?.data?.silver?.price_gram_24k || "31"),
          };

          console.log("Logging successful gifting to database:", giftingData);
          const success = await createGifting(giftingData, false);

          if (success) {
            console.log("Successfully logged gifting to database");
            // Invalidate gifting history to refresh the list
            queryClient.invalidateQueries({ queryKey: giftingKeys.all });
          } else {
            console.error(
              "Failed to log gifting to database - API returned false",
            );
          }
        } catch (error) {
          console.error("Failed to log successful gifting:", error);
        }
      };

      logSuccessfulGifting();
    }
  }, [isTokenConfirmed, tokenHash]);

  // Handle successful Solana transfer
  useEffect(() => {
    if (
      isSolanaConfirmed &&
      solanaHash &&
      !showSuccessPopup &&
      successLoggedRef.current !== solanaHash
    ) {
      setShowSuccessPopup(true);
      successLoggedRef.current = solanaHash;

      const logSuccessfulSolanaGifting = async () => {
        try {
          const giftingData = {
            recipientWallet: form.wallet,
            token: form.token.toLowerCase() as "gold" | "silver",
            quantity: form.quantity,
            message: form.message || undefined,
            network:
              form.network === "Private"
                ? ("canton" as const)
                : form.network === "Ethernet"
                  ? ("public" as const)
                  : ("solana" as const),
            status: "completed" as const,
            transactionHash: solanaHash,
            tokenValueUSD: calculations.tokenValueUSD.toString(),
            platformFeeUSD: "0",
            totalCostUSD: calculations.totalCostUSD.toString(),
            gramsAmount: calculations.gramsAmount.toString(),
            currentTokenPrice:
              form.token.toUpperCase() === "GOLD"
                ? String(pricesData?.data?.gold?.price_gram_24k || "108")
                : String(pricesData?.data?.silver?.price_gram_24k || "31"),
          };

          console.log(
            "Logging successful Solana gifting to database:",
            giftingData,
          );
          const success = await createGifting(giftingData, false);

          if (success) {
            console.log("Successfully logged Solana gifting to database");
            // Invalidate gifting history to refresh the list
            queryClient.invalidateQueries({ queryKey: giftingKeys.all });
            // Reset form after successful database logging
            setForm({
              wallet: "",
              token: "GOLD",
              quantity: "",
              message: "",
              network: "Ethereum",
            });
          } else {
            console.error(
              "Failed to log Solana gifting to database - API returned false",
            );
          }
        } catch (error) {
          console.error("Failed to log successful Solana gifting:", error);
        }
      };

      logSuccessfulSolanaGifting();
    }
  }, [isSolanaConfirmed, solanaHash]);

  // Handle failed transfer logging
  useEffect(() => {
    if (tokenTransferError && form.wallet && form.quantity) {
      const logFailedGifting = async () => {
        try {
          const giftingData = {
            recipientWallet: form.wallet,
            token: form.token.toLowerCase() as "gold" | "silver",
            quantity: form.quantity,
            message: form.message || undefined,
            network:
              form.network === "Private"
                ? ("canton" as const)
                : form.network === "Ethernet"
                  ? ("public" as const)
                  : ("solana" as const),
            status: "failed" as const,
            transactionHash: `failed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            errorMessage:
              tokenTransferError.message || t("gifting.transferFailed"),
            tokenValueUSD: calculations.tokenValueUSD.toString(),
            totalCostUSD: calculations.totalCostUSD.toString(),
            gramsAmount: calculations.gramsAmount.toString(),
            currentTokenPrice:
              form.token.toUpperCase() === "GOLD"
                ? String(pricesData?.data?.gold?.price_gram_24k || "108")
                : String(pricesData?.data?.silver?.price_gram_24k || "31"),
          };

          console.log("Logging failed gifting to database:", giftingData);
          await createGifting(giftingData);
        } catch (error) {
          console.error("Failed to log failed gifting:", error);
        }
      };

      logFailedGifting();
    }
  }, [tokenTransferError]);

  // Handle failed Solana transfer logging
  useEffect(() => {
    if (solanaTransferError && form.wallet && form.quantity) {
      const logFailedSolanaGifting = async () => {
        try {
          const giftingData = {
            recipientWallet: form.wallet,
            token: form.token.toLowerCase() as "gold" | "silver",
            quantity: form.quantity,
            message: form.message || undefined,
            network:
              form.network === "Private"
                ? ("canton" as const)
                : form.network === "Ethernet"
                  ? ("public" as const)
                  : ("solana" as const),
            status: "failed" as const,
            transactionHash: `failed-solana-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            errorMessage:
              solanaTransferError.message || t("gifting.transferFailed"),
            tokenValueUSD: calculations.tokenValueUSD.toString(),
            totalCostUSD: calculations.totalCostUSD.toString(),
            gramsAmount: calculations.gramsAmount.toString(),
            currentTokenPrice:
              form.token.toUpperCase() === "GOLD"
                ? String(pricesData?.data?.gold?.price_gram_24k || "108")
                : String(pricesData?.data?.silver?.price_gram_24k || "31"),
          };

          console.log(
            "Logging failed Solana gifting to database:",
            giftingData,
          );
          await createGifting(giftingData);
        } catch (error) {
          console.error("Failed to log failed Solana gifting:", error);
        }
      };

      logFailedSolanaGifting();
    }
  }, [solanaTransferError]);

  // Validation
  const validQuantity =
    Number(form.quantity) > 0 && !isNaN(Number(form.quantity));
  const validWallet = form.wallet.length > 20;

  // New validation rules - handle case sensitivity correctly for different wallet types
  const normalizeAddressForComparison = (addr: string): string => {
    const trimmed = addr.trim();
    return trimmed.startsWith("0x") ? trimmed.toLowerCase() : trimmed;
  };

  const isSameWallet =
    isConnected &&
    address &&
    form.wallet &&
    normalizeAddressForComparison(form.wallet) ===
      normalizeAddressForComparison(address);
  // Remove balance validation from form state - will check on demand

  // Combined validation (balance will be checked on submit)
  const isValidForm = validWallet && validQuantity && !isSameWallet;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleChange = (e: any) => {
    console.log("e", e);
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "wallet") {
      setWalletValidation({
        isChecked: false,
        exists: false,
        isValidating: false,
      });
      clearWalletError();
    }
  };

  const handleMetalChange = (value: any, name: any) => {
    console.log("e", value, name);
    // const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Get Solana token balances using the direct hook
  const { silver, gold } = useSolanaTokenBalance();
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Check if wallet is same as sender
    if (isSameWallet) {
      toast({
        title: t("gifting.invalidRecipient"),
        description: t("gifting.invalidRecipientDescription"),
        variant: "destructive",
      });
      return;
    }

    // Check balance on demand when user clicks gift button using blockchain functions
    console.log("VIVEKSINGHPAYAL", form.network, currentNetwork);

    // Skip balance check for private network as backend handles it
    if (form.network !== "private") {
      try {
        setIsCheckingBalance(true);
        let currentBalance = 0;

        if (currentNetwork === "Solana") {
          // Use the balance from the hook which now fetches mint addresses from config
          if (form.token?.toUpperCase() === "GOLD") {
            currentBalance = gold || 0;
          } else {
            currentBalance = silver || 0;
          }

          console.log(`Solana ${form.token} balance check:`, currentBalance);
        } else if (currentNetwork === "Ethereum") {
          // Use Ethereum blockchain functions directly
          const { ethers } = await import("ethers");

          if (address) {
            const tokenConfig =
              form.token?.toUpperCase() === "GOLD"
                ? {
                    contractAddress: EVM_GOLD_TOKEN_CONTRACT?.trim(),
                    decimals: 18,
                  }
                : {
                    contractAddress: EVM_SILVER_TOKEN_CONTRACT?.trim(),
                    decimals: 18,
                  };

            const rpcUrl = ETHEREUM_RPC_URL;
            const provider = new ethers.JsonRpcProvider(rpcUrl);

            // ERC-20 ABI for balance checking
            const ERC20_ABI = [
              {
                constant: true,
                inputs: [{ name: "_owner", type: "address" }],
                name: "balanceOf",
                outputs: [{ name: "balance", type: "uint256" }],
                type: "function",
              },
            ];

            const tokenContract = new ethers.Contract(
              tokenConfig.contractAddress,
              ERC20_ABI,
              provider,
            );

            const balanceWei = await tokenContract.balanceOf(address);
            const balance = ethers.formatUnits(
              balanceWei,
              tokenConfig.decimals,
            );
            currentBalance = parseFloat(balance);
          }
        }

        // Check if user has sufficient balance
        if (Number(form.quantity) > currentBalance) {
          toast({
            title: t("gifting.insufficientBalanceTitle"),
            description: t("gifting.insufficientBalanceDescription", {
              balance: currentBalance.toFixed(2),
              token: form.token,
              quantity: form.quantity,
            }),
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error("Balance check error:", error);
        // If balance check fails, show generic error
        toast({
          title: t("gifting.balanceCheckFailed"),
          description: t("gifting.balanceCheckFailedDescription"),
          variant: "destructive",
        });
        return;
      } finally {
        setIsCheckingBalance(false);
      }
    }

    // Skip wallet check for private network as it uses different addressing
    if (form.network === "private") {
      setShowConfirm(true);
    } else {
      try {
        setWalletValidation({ ...walletValidation, isValidating: true });
        const result = await checkWalletExists(form.wallet);

        if (result) {
          setShowConfirm(true);
        } else {
          toast({
            title: t("gifting.walletNotFound"),
            description: t("gifting.walletNotFoundDescription"),
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: t("gifting.validationError"),
          description: error.message || t("gifting.validationErrorDescription"),
          variant: "destructive",
        });
      } finally {
        setWalletValidation({ ...walletValidation, isValidating: false });
      }
    }
  };

  const handleConfirm = async () => {
    setShowConfirm(false);

    if (form.network === "Ethereum") {
      if (!isConnected) {
        toast({
          title: t("gifting.walletNotConnected"),
          description: t("gifting.walletNotConnectedDescription"),
          variant: "destructive",
        });
        return;
      }

      try {
        await tokenTransferFn({
          to: form.wallet,
          amount: form.quantity,
          decimals: 18,
        });
      } catch (error: any) {
        console.error("Failed to log failed gifting:", error);
      }
    } else if (form.network === "Solana") {
      // Use Solana token transfer for Solana network
      if (!isConnected) {
        toast({
          title: t("gifting.walletNotConnected"),
          description: t("gifting.walletNotConnectedDescription"),
          variant: "destructive",
        });
        return;
      }

      try {
        console.log("yo sol");
        await solanaTransferFn({
          to: form.wallet,
          amount: parseFloat(form.quantity),
        });
      } catch (error: any) {
        console.error("Failed to initiate Solana transfer:", error);
      }
    } else if (form.network === "Private") {
      // Use DAML API for private network transfers
      try {
        setIsPrivateTransferLoading(true);

        const damlPayload = {
          recipient: form.wallet,
          amount: Number(form.quantity),
          message: form.token,
        };

        console.log("Initiating DAML transfer with payload:", damlPayload);

        const response = await fetch("/api/daml/transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          },
          body: JSON.stringify(damlPayload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Handle successful transfer
          // Generate unique transaction hash for private network
          const transactionId = `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          console.log(
            "Generated private network transaction hash:",
            transactionId,
          );

          toast({
            title: t("gifting.giftSent"),
            description: t("gifting.giftSentSuccessfully", {
              token: form.token,
            }),
            duration: 5000,
          });

          // Log successful private network gifting to database
          try {
            const giftingData = {
              recipientWallet: form.wallet,
              token: form.token.toLowerCase() as "gold" | "silver",
              quantity: form.quantity,
              message: form.message || undefined,
              network:
                form.network === "Private"
                  ? ("canton" as const)
                  : form.network === "Ethernet"
                    ? ("public" as const)
                    : ("solana" as const),
              status: "completed" as const,
              transactionHash: transactionId,
              tokenValueUSD: calculations.tokenValueUSD.toString(),
              platformFeeUSD: "0",
              totalCostUSD: calculations.totalCostUSD.toString(),
              gramsAmount: calculations.gramsAmount.toString(),
              currentTokenPrice:
                form.token.toUpperCase() === "GOLD"
                  ? String(pricesData?.data?.gold?.price_gram_24k || "108")
                  : String(pricesData?.data?.silver?.price_gram_24k || "31"),
            };

            console.log(
              "Logging successful private network gifting to database:",
              giftingData,
            );
            const success = await createGifting(giftingData, false);

            if (success) {
              console.log(
                "Successfully logged private network gifting to database",
              );
              // Invalidate gifting history to refresh the list
              queryClient.invalidateQueries({ queryKey: giftingKeys.all });
            } else {
              console.error(
                "Failed to log private network gifting to database - API returned false",
              );
            }
          } catch (error) {
            console.error(
              "Failed to log successful private network gifting:",
              error,
            );
          }

          // Reset form
          setForm({
            wallet: "",
            token: "GOLD",
            quantity: "",
            message: "",
            network: "Ethereum",
          });
        } else {
          // Handle transfer failure
          toast({
            title: t("gifting.transferFailed"),
            description:
              result.message || t("gifting.privateNetworkTransferFailed"),
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Private network transfer error:", error);

        toast({
          title: t("gifting.transferFailed"),
          description:
            error.message || t("gifting.privateNetworkTransferFailed"),
          variant: "destructive",
        });
      } finally {
        setIsPrivateTransferLoading(false);
      }
    } else {
      // Other networks
      toast({
        title: t("gifting.giftSent"),
        description: t("gifting.giftSentDescription", {
          quantity: form.quantity,
          token: form.token,
          wallet: form.wallet.slice(0, 8) + "..." + form.wallet.slice(-6),
        }),
        duration: 5000,
      });

      setForm({
        ...form,
        quantity: "",
        wallet: "",
        message: "",
        network: "Ethereum",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Gift Form */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("gifting.sendGift")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="wallet">
                    {t("gifting.recipientWalletAddress")}
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-brand-brown hover:text-brand-dark-gold dark:text-brand-gold dark:hover:text-brand-gold/80 cursor-default" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="max-w-xs">
                          {t("gifting.recipientWalletTooltip")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="wallet"
                    name="wallet"
                    value={form.wallet}
                    onChange={handleChange}
                    required
                    className="flex-1"
                    placeholder={t("gifting.enterWalletAddress")}
                    data-testid="input-recipient-wallet"
                  />
                </div>
                {isSameWallet && (
                  <Alert className="mt-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-700 dark:text-red-400">
                      {t("gifting.cannotSendToSelf")}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="token" className="text-sm sm:text-base">
                    {t("gifting.token")}
                  </Label>
                  <Select
                    name="token"
                    value={form.token}
                    onValueChange={(value) => handleMetalChange(value, "token")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("gifting.token")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">
                        {t("dashboard.gold")}
                      </SelectItem>
                      <SelectItem value="silver">
                        {t("dashboard.silver")}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* <select
                    id="token"
                    name="token"
                    value={form.token}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  >
                    <option value="GOLD">GOLD</option>
                    <option value="SILVER">SILVER</option>
                  </select> */}
                </div>

                <div>
                  <Label htmlFor="network" className="text-sm sm:text-base">
                    {t("gifting.network")}
                  </Label>
                  <Select
                    name="network"
                    value={form.network}
                    onValueChange={(value) =>
                      handleMetalChange(value, "network")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("dashboard.selectNetwork")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        {t("dashboard.privateNetwork")}
                      </SelectItem>
                      <SelectItem value="public">
                        {t("dashboard.publicNetwork")}
                      </SelectItem>
                      <SelectItem value="solana">
                        {t("dashboard.solanaNetwork")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quantity" className="text-sm sm:text-base">
                      {t("gifting.tokenQuantityGrams")}
                    </Label>
                  </div>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    value={form.quantity}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                      if (
                        e.key === "e" ||
                        e.key === "E" ||
                        e.key === "+" ||
                        e.key === "-"
                      ) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData("text");
                      if (
                        pastedText.includes("e") ||
                        pastedText.includes("E") ||
                        pastedText.includes("+") ||
                        pastedText.includes("-")
                      ) {
                        e.preventDefault();
                      }
                    }}
                    required
                    placeholder={t("gifting.enterQuantity")}
                    className="mt-1 text-sm"
                    data-testid="input-token-quantity"
                  />
                  {/* Balance validation will be performed when user clicks Gift button */}
                  {form.quantity && validQuantity && (
                    <div className="bg-gray-50 mt-2 dark:bg-gray-800/50 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700">
                      {isPricesLoading && (
                        <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          <span>{t("gifting.loadingLivePrices")}</span>
                        </div>
                      )}
                      {pricesError && (
                        <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{t("gifting.usingFallbackPrices")}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {t("gifting.grams")}:{" "}
                            {calculations.gramsAmount.toFixed(2)}g
                          </span>
                          <span>
                            {t("gifting.tokenValue")}: $
                            {calculations.tokenValueUSD.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm border-t pt-2 border-gray-200 dark:border-gray-600">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {t("gifting.totalCost")}: $
                            {calculations.totalCostUSD.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isPricesLoading
                              ? t("gifting.updating")
                              : pricesError
                                ? t("gifting.fallbackPrices")
                                : t("gifting.livePrices")}
                          </span>
                        </div>
                        {form.network === "Ethereum" && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                {t("gifting.blockchainTransfer", {
                                  token: form.token,
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                        {form.network === "Private" && (
                          <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-4 border-purple-400">
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                              <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                                Private DAML Ledger Transfer - {form.token}{" "}
                                tokens
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm sm:text-base">
                    {t("gifting.messageOptional")}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t("gifting.addPersonalMessage")}
                    className="mt-1 resize-none text-sm"
                    rows={form.quantity && validQuantity ? 4 : 2}
                  />
                </div>
              </div>

              {form.network === "Ethereum" && !isConnected && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("gifting.walletConnectionRequired")}
                  </AlertDescription>
                </Alert>
              )}

              {tokenTransferError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("gifting.transferFailed", {
                      error: tokenTransferError.message,
                    })}
                  </AlertDescription>
                </Alert>
              )}

              {isTokenConfirmed && tokenHash && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {t("gifting.giftSentSuccessfully", { token: form.token })}
                    <br />
                    <span className="text-xs font-mono break-all">
                      {t("gifting.transaction")}: {tokenHash}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {solanaTransferError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("gifting.transferFailed", {
                      error: solanaTransferError.message,
                    })}
                  </AlertDescription>
                </Alert>
              )}

              {isSolanaConfirmed && solanaHash && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {t("gifting.giftSentSuccessfully", { token: form.token })}{" "}
                    (Solana)
                    <br />
                    <span className="text-xs font-mono break-all">
                      {t("gifting.transaction")}: {solanaHash}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full text-sm sm:text-base py-2 sm:py-3"
                disabled={
                  !isValidForm ||
                  isTokenTransferLoading ||
                  isSolanaLoading ||
                  walletValidation.isValidating ||
                  isCheckingBalance ||
                  isPrivateTransferLoading
                }
                data-testid="button-send-gift"
              >
                {isCheckingBalance ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    {t("gifting.loadingBalance")}
                  </>
                ) : walletValidation.isValidating ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    {t("gifting.validatingWallet")}
                  </>
                ) : isTokenTransferLoading ||
                  isSolanaLoading ||
                  isPrivateTransferLoading ? (
                  <>
                    <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    {isConfirming || isSolanaConfirming
                      ? t("gifting.confirmingTransfer")
                      : t("gifting.sendingGift")}
                  </>
                ) : (
                  <>
                    <Gift className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {t("gifting.giftTokens")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Gifting History */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("gifting.giftingHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                      {t("gifting.recipient")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                      {t("gifting.token")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                      {t("gifting.quantity")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden sm:table-cell">
                      {t("gifting.grams")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                      {t("gifting.tokenValue")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden md:table-cell">
                      {t("gifting.totalCost")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden lg:table-cell">
                      {t("gifting.network")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden xl:table-cell">
                      {t("gifting.message")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                      {t("gifting.date")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                      {t("gifting.status")}
                    </th>
                    <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                      {t("gifting.share")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHistory ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <tr
                        key={`skeleton-${index}`}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-3 sm:h-4 w-8 sm:w-12" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-20" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden sm:table-cell">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-20" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-20" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden xl:table-cell">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-3 sm:h-4 w-10 sm:w-14" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-4 sm:h-6 w-12 sm:w-16 rounded-full" />
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <Skeleton className="h-3 sm:h-4 w-8 sm:w-12" />
                        </td>
                      </tr>
                    ))
                  ) : historyError ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-8 text-center text-red-600"
                      >
                        <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                        {t("gifting.errorLoadingHistory", {
                          error: historyError,
                        })}
                      </td>
                    </tr>
                  ) : giftings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-8 text-center text-gray-500"
                      >
                        {t("gifting.noGiftingHistory")}
                      </td>
                    </tr>
                  ) : (
                    giftings.map((gift: any) => (
                      <tr
                        key={gift._id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="font-mono text-xs sm:text-sm">
                              {gift.recipientWallet?.slice(0, 6)}...
                              {gift.recipientWallet?.slice(-4)}
                            </span>
                            <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <span
                            className={`px-1 sm:px-2 py-1 rounded text-xs font-medium ${
                              gift.token === "gold"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {gift.token.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                          {gift.quantity}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                          {gift.gramsAmount}g
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                          ${parseFloat(gift.tokenValueUSD || "0").toFixed(2)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden md:table-cell">
                          ${parseFloat(gift.totalCostUSD || "0").toFixed(2)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            {gift.network === "public" ? (
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                            ) : gift.network === "Solana" ? (
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                            ) : (
                              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                            )}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {gift.network === "public"
                                ? "Polygon"
                                : gift.network === "solana"
                                  ? "Solana"
                                  : "Canton"}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                          {gift.message || "-"}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="hidden sm:block">
                            {formatDate(gift.createdAt)}
                          </div>
                          <div className="sm:hidden">
                            {new Date(gift.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <span
                            className={`px-1 sm:px-2 py-1 rounded text-xs font-medium ${
                              gift.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                : gift.status === "failed"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                            }`}
                          >
                            {gift.status}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const message = `🎁 I've sent you ${gift.quantity} ${gift.token} tokens (${gift.gramsAmount}g) worth ${parseFloat(gift.tokenValueUSD || "0").toFixed(2)}! Transaction: ${gift.transactionHash || "Pending"}`;
                                window.open(
                                  `https://t.me/share/url?url=${encodeURIComponent(message)}`,
                                  "_blank",
                                );
                              }}
                              className="p-1 h-6 w-6 sm:h-8 sm:w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title={t("gifting.shareOnTelegram")}
                            >
                              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const message = `🎁 I've sent you ${gift.quantity} ${gift.token} tokens (${gift.gramsAmount}g) worth ${parseFloat(gift.tokenValueUSD || "0").toFixed(2)}! Transaction: ${gift.transactionHash || "Pending"}`;
                                window.open(
                                  `https://wa.me/?text=${encodeURIComponent(message)}`,
                                  "_blank",
                                );
                              }}
                              className="p-1 h-6 w-6 sm:h-8 sm:w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title={t("gifting.shareOnWhatsApp")}
                            >
                              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={goToPage}
                onNext={nextPage}
                onPrev={prevPage}
                onFirst={goToFirstPage}
                onLast={goToLastPage}
                isLoading={isLoadingHistory}
              />
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {t("gifting.confirmGift")}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>
                {t("gifting.confirmGiftMessage", {
                  quantity: form.quantity || "0",
                  token: form.token || "GOLD",
                  wallet: form.wallet
                    ? form.wallet.slice(0, 8) + "..." + form.wallet.slice(-6)
                    : t("common.unknown"),
                })}{" "}
                <b>
                  {form.quantity} {form.token}
                </b>{" "}
                ({calculations.gramsAmount.toFixed(1)}g, $
                {calculations.tokenValueUSD.toFixed(2)})
              </p>
              <p className="break-all text-xs text-gray-700 dark:text-gray-300 mt-2 font-mono">
                {form.wallet}
              </p>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {form.network === "Private" ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {form.network} {t("gifting.network")}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{t("gifting.tokenValue")}:</span>
                    <span>${calculations.tokenValueUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>{t("gifting.totalCost")}:</span>
                    <span>${calculations.totalCostUSD.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              {form.message && (
                <p className="mt-2 text-sm">
                  <b>{t("gifting.message")}:</b> {form.message}
                </p>
              )}
              {/* <p className="text-xs text-gray-500 mt-2">
                Recipient may need to complete KYC to claim.
              </p> */}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="w-full sm:w-auto"
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleConfirm} className="w-full sm:w-auto">
                {t("gifting.confirmGiftButton")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Popup Dialog */}
        <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                {t("gifting.transferSuccessful")}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">
                {t("gifting.giftSentDescription", {
                  quantity: form.quantity,
                  token: form.token,
                  wallet:
                    form.wallet.slice(0, 8) + "..." + form.wallet.slice(-6),
                })}
              </p>

              {(tokenHash || solanaHash) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                    <b>{t("gifting.transaction")} Hash:</b>
                  </p>
                  <p className="text-xs font-mono break-all text-green-700 dark:text-green-300">
                    {tokenHash || solanaHash}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-4">
                {t("gifting.recipientWillReceive")}
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowSuccessPopup(false);
                  // Clear the success logged ref to allow future transactions
                  successLoggedRef.current = null;
                  setForm({
                    wallet: "",
                    token: "GOLD",
                    quantity: "",
                    message: "",
                    network: "Ethereum",
                  });
                }}
                className="w-full"
                data-testid="button-done-success"
              >
                {t("common.done")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
