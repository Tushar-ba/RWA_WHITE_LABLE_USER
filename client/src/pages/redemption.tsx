import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Clock,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle,
  Globe,
  Shield,
} from "lucide-react";
import { Country, State } from "country-state-city";
import { useRequestRedemption } from "@/hooks/useRequestRedemption";
import { useCancelRedemption } from "@/hooks/useCancelRedemption";
import { type TokenType } from "@/hooks/shared/tokenTypes";
import { useSolanaTokenRedemption } from "@/hooks/useSolanaTokenRedemption";
import { useRedemption, useRedemptionHistory } from "@/hooks/useRedemption";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { BN } from "@coral-xyz/anchor";
import { useAuthStore } from "@/stores/authStore";
import { apiRequest } from "@/lib/queryClient";
import { ENV } from "@shared/constants";

interface RedemptionForm {
  token: "GOLD" | "SILVER";
  quantity: string;
  network: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function Redemption() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [form, setForm] = useState<RedemptionForm>({
    token: "GOLD",
    quantity: "",
    network: "Ethereum",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransactionHash, setSuccessTransactionHash] =
    useState<string>("");
  const [isSolanaRedemption, setIsSolanaRedemption] = useState<boolean>(false);
  const [isPrivateRedemptionLoading, setIsPrivateRedemptionLoading] =
    useState<boolean>(false);

  const [cancelSolRedemption, setCancelSolRedemption] =
    useState<boolean>(false);

  // AppKit account connection status
  const { address, isConnected } = useAppKitAccount();

  // Solana connection status
  const { connection: solanaConnection } = useAppKitConnection();

  // Initialize token redemption hook - only for Ethereum network
  const {
    requestRedemption,
    isPending,
    isConfirming,
    isConfirmed,
    transactionHash,
    error: redemptionError,
    isLoading,
  } = useRequestRedemption(form.token as TokenType);
  console.log("redem", isLoading);

  // Initialize Solana token redemption hooks with optional Anchor Program
  // const { requestRedemption: solanaRedemption, cancelRedemption } =
  //   useSolanaTokenRedemption(form?.token);
  const solanaGoldRedemptionHook = useSolanaTokenRedemption("GOLD");
  const solanaSilverRedemptionHook = useSolanaTokenRedemption("SILVER");
  // Initialize separate hooks for cancel operations
  const goldRedemptionHook = useCancelRedemption("GOLD");
  const silverRedemptionHook = useCancelRedemption("SILVER");

  // State for tracking which redemption is being cancelled
  const [cancellingRedemption, setCancellingRedemption] = useState<
    string | null
  >(null);

  // State for tracking redemption pending blockchain confirmation
  const [pendingCancelRedemption, setPendingCancelRedemption] =
    useState<any>(null);

  // Initialize redemption API hook for database persistence
  const { createRedemption, updateRedemption } = useRedemption();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);

  // Fetch redemption history using the hook with pagination
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    invalidateRedemptions,
  } = useRedemptionHistory(currentPage, pageLimit);

  // Add error handling in useEffect for transaction failures
  useEffect(() => {
    // Handle transaction errors for both gold and silver hooks
    if (goldRedemptionHook.error || silverRedemptionHook.error) {
      console.log("Transaction error detected, resetting cancellation state");
      console.log("Stopping loader due to transaction error");
      setCancellingRedemption(null);
      setPendingCancelRedemption(null);

      // Show error toast
      const error = goldRedemptionHook.error || silverRedemptionHook.error;
      toast({
        title: t("redemption.cancelError"),
        description: `Transaction failed: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  }, [goldRedemptionHook.error, silverRedemptionHook.error]);

  // Add timeout mechanism for stuck transactions
  useEffect(() => {
    if (pendingCancelRedemption) {
      console.log("Setting up timeout for pending cancellation");
      const timeout = setTimeout(() => {
        console.log("Cancellation timeout reached, clearing states");
        setPendingCancelRedemption(null);
        setCancellingRedemption(null);
        toast({
          title: t("redemption.cancelError"),
          description: t("toasts.transactionTimeout"),
          variant: "destructive",
        });
      }, 300000); // 5 minutes timeout

      return () => {
        console.log("Clearing cancellation timeout");
        clearTimeout(timeout);
      };
    }
  }, [pendingCancelRedemption]);

  // Effect to handle database update when Ethereum cancellation transaction is confirmed
  useEffect(() => {
    console.log(
      "Checking for confirmed Ethereum cancellation...",
      goldRedemptionHook,
    );
    const processConfirmedCancellation = async () => {
      if (!pendingCancelRedemption) return;

      const { hookToUse } = pendingCancelRedemption;

      // Debug: Log all hook states
      console.log("=== DEBUGGING HOOK STATES ===");
      console.log("Gold hook states:", {
        isPending: goldRedemptionHook.isPending,
        isConfirming: goldRedemptionHook.isConfirming,
        isConfirmed: goldRedemptionHook.isConfirmed,
        hash: goldRedemptionHook.transactionHash,
      });
      console.log("Silver hook states:", {
        isPending: silverRedemptionHook.isPending,
        isConfirming: silverRedemptionHook.isConfirming,
        isConfirmed: silverRedemptionHook.isConfirmed,
        hash: silverRedemptionHook.transactionHash,
      });
      console.log("hookToUse states:", {
        isPending: hookToUse.isPending,
        isConfirming: hookToUse.isConfirming,
        isConfirmed: hookToUse.isConfirmed,
        hash: hookToUse.transactionHash,
      });

      // Check if the hook's transaction is confirmed
      if (hookToUse.isConfirmed) {
        console.log("=== ETHEREUM CANCELLATION CONFIRMED ===");
        console.log("Proceeding with database status update to 'cancelled'");
        console.log(
          "Stopping loader for redemption:",
          pendingCancelRedemption.redemptionId,
        );

        try {
          const success = await updateRedemption(
            pendingCancelRedemption.redemptionId,
            { status: "cancelled" },
            pendingCancelRedemption.address,
          );

          if (success) {
            console.log("Database update successful - invalidating cache");
            invalidateRedemptions();
            toast({
              title: t("redemption.cancelSuccess"),
              description: t("redemption.cancelSuccess"),
            });
          } else {
            console.error("Database update failed");
            toast({
              title: t("redemption.cancelError"),
              description: t("toasts.databaseUpdateFailed"),
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error during database update:", error);
          toast({
            title: t("redemption.cancelError"),
            description: t("toasts.databaseUpdateFailed"),
            variant: "destructive",
          });
        } finally {
          // Always clear the pending state to stop the loader, even if database update fails
          console.log("Clearing cancellation states to stop loader");
          setPendingCancelRedemption(null);
          setCancellingRedemption(null);
        }
      }
    };

    processConfirmedCancellation();
  }, [
    goldRedemptionHook.isPending,
    goldRedemptionHook.isConfirming,
    goldRedemptionHook.isConfirmed,
    goldRedemptionHook.transactionHash,
    silverRedemptionHook.isPending,
    silverRedemptionHook.isConfirming,
    silverRedemptionHook.isConfirmed,
    silverRedemptionHook.transactionHash,
    pendingCancelRedemption,
    updateRedemption,
    invalidateRedemptions,
  ]);

  // Extract redemptions and pagination from the response
  const redemptions = historyData?.redemptions || [];
  const pagination = historyData?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };

  // Pagination navigation functions
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

  // Type guard for redemptions array
  const typedRedemptions = Array.isArray(redemptions) ? redemptions : [];

  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [deliveryFee] = useState(25.99);

  // Format date for display
  const formatDate = (date: string | Date) => {
    const locale = localStorage.getItem("i18nextLng") || "en";
    return new Date(date).toLocaleDateString(
      locale === "zh" ? "zh-CN" : locale === "zh-tw" ? "zh-TW" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  useEffect(() => {
    // Load all countries on component mount
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  useEffect(() => {
    // Load states when country changes
    if (form.country) {
      const selectedCountry = countries.find((c) => c.name === form.country);
      if (selectedCountry) {
        const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
        setStates(countryStates);
      } else {
        setStates([]);
      }
      // Reset state when country changes
      setForm((prev) => ({ ...prev, state: "" }));
    } else {
      setStates([]);
    }
  }, [form.country, countries]);

  const logSuccessfulRedemption = async (transactionHash: string) => {
    try {
      const fullAddress = `${form.streetAddress}, ${form.city}, ${form.state} ${form.zipCode}, ${form.country}`;

      // Create minimal redemption record - blockchain listener will fill the rest
      await createRedemption({
        ...form,
        token: form.token.toLowerCase(),
        network:
          form.network === "Private"
            ? "canton"
            : form.network === "Ethereum"
              ? "public"
              : "solana",
        walletAddress: address || "", // Add wallet address
        transactionHash: transactionHash,
        deliveryAddress: fullAddress,
        status: "pending",
      });

      // Show success modal instead of toast
      setSuccessTransactionHash(transactionHash as string);
      setShowSuccessModal(true);

      // Reset form
      setForm({
        token: "GOLD",
        quantity: "",
        network: "Ethereum",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      });

      // Invalidate redemption cache to refetch the latest data
      invalidateRedemptions();
    } catch (error) {
      console.error("Error logging redemption:", error);
      toast({
        title: t("redemption.warningTitle"),
        description: t("redemption.warningDescription"),
        variant: "destructive",
      });
    }
  };
  // Handle successful blockchain redemption with database logging - Ethereum
  useEffect(() => {
    if (isConfirmed && transactionHash && form.network === "Ethereum") {
      logSuccessfulRedemption(transactionHash);
    }
  }, [isConfirmed, transactionHash]);

  // Token values with dynamic conversion from environment
  const goldMgPerToken = parseFloat(GOLD_MG_PER_TOKEN || "10");
  const silverMgPerToken = parseFloat(SILVER_MG_PER_TOKEN || "10");

  const tokenValues = {
    GOLD: {
      name: "Gold",
      gramsPerToken: goldMgPerToken / 1000, // Convert mg to grams
      mgPerToken: goldMgPerToken,
      price: 65.5,
    },
    SILVER: {
      name: "Silver",
      gramsPerToken: silverMgPerToken / 1000, // Convert mg to grams
      mgPerToken: silverMgPerToken,
      price: 0.85,
    },
  };

  // Network fee configuration
  const networkFees = {
    Ethereum: { name: "Ethereum", fee: 0.5, icon: Globe },
    Solana: { name: "Solana", fee: 0.3, icon: Globe },
    Private: { name: "Private", fee: 2.0, icon: Shield },
  };

  // Validation
  const tokenInfo = tokenValues[form.token as keyof typeof tokenValues];
  const validQuantity = Number(form.quantity) > 0;

  // Calculate grams based on token and quantity
  const getGrams = () => {
    const quantity = Number(form.quantity);
    return quantity * tokenInfo.gramsPerToken;
  };

  // Calculate USD value
  const getUSDValue = () => {
    const quantity = Number(form.quantity);
    return quantity * tokenInfo.price;
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const fullAddress = `${form.streetAddress}, ${form.city}, ${form.state} ${form.zipCode}, ${form.country}`;

    // Ethereum network - use Ethereum token redemption
    if (form.network === "Ethereum") {
      if (!isConnected) {
        toast({
          title: t("redemption.walletNotConnectedTitle"),
          description: t("redemption.walletNotConnectedDescription"),
          variant: "destructive",
        });
        return;
      }

      try {
        // Make blockchain redemption request
        await requestRedemption({ tokenAmount: form.quantity });
      } catch (error) {
        console.error("Blockchain redemption failed:", error);
        toast({
          title: t("redemption.redemptionFailedTitle"),
          description: t("redemption.redemptionFailedDescription"),
          variant: "destructive",
        });
      }
    }
    // Solana network - use Solana token redemption
    else if (form.network === "Solana") {
      if (!solanaConnection) {
        toast({
          title: t("redemption.walletNotConnectedTitle"),
          description: t("redemption.solanaWalletNotConnectedDescription"),
          variant: "destructive",
        });
        return;
      }

      try {
        // Make Solana blockchain redemption request
        const amount = parseFloat(form.quantity) * 1000000000;
        const solanaRedemption =
          form.token === "GOLD"
            ? solanaGoldRedemptionHook.requestRedemption
            : solanaSilverRedemptionHook.requestRedemption;
        const result = await solanaRedemption(
          amount,
          logSuccessfulRedemption,
          setIsSolanaRedemption,
        );

        // If result is null, it means there was an error and toast was already shown
        if (!result) {
          return;
        }
      } catch (error) {
        console.error("Solana redemption failed:", error);
        // Error handling is now done in the hook, but keep this as fallback
        toast({
          title: t("redemption.redemptionFailedTitle"),
          description: t("redemption.solanaRedemptionFailedDescription"),
          variant: "destructive",
        });
      }
    }
    // Private network - use DAML API
    else if (form.network === "Private") {
      try {
        setIsPrivateRedemptionLoading(true);

        const response = await fetch("/api/daml/redemption", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${useAuthStore.getState().token}`,
          },
          body: JSON.stringify({
            amount: Number(form.quantity),
            tokenType: form.token,
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Handle successful DAML redemption request
          const requestId = result.data.transactionId;

          toast({
            title: t("redemption.requestSubmitted"),
            description: t("redemption.damlRedemptionSuccess", { requestId }),
            duration: 5000,
          });

          // Log successful private network redemption to database
          try {
            await createRedemption({
              ...form,
              token: form.token.toLowerCase(),
              network:
                form.network === "Private"
                  ? "canton"
                  : form.network === "Ethereum"
                    ? "public"
                    : "solana",
              walletAddress: result.data.redeemer || "", // Use DAML party ID as wallet
              transactionHash: requestId,
              deliveryAddress: fullAddress,
              status: "pending",
              requestId: requestId,
            });

            console.log(
              "Successfully logged private network redemption to database",
            );
          } catch (dbError) {
            console.error("Failed to log private network redemption:", dbError);
          }

          // Show success modal
          setSuccessTransactionHash(requestId);
          setShowSuccessModal(true);

          // Reset form
          setForm({
            token: "GOLD",
            quantity: "",
            network: "Ethereum",
            streetAddress: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          });

          // Invalidate redemption cache to refetch the latest data
          invalidateRedemptions();
        } else {
          // Handle DAML API error
          toast({
            title: t("redemption.errorTitle"),
            description: result.message || t("redemption.damlRedemptionError"),
            variant: "destructive",
          });

          // Log failed private network redemption to database
          try {
            await createRedemption({
              ...form,
              token: form.token.toLowerCase(),
              network:
                form.network === "Private"
                  ? "canton"
                  : form.network === "Ethereum"
                    ? "public"
                    : "solana",
              walletAddress: "",
              transactionHash: `failed-private-${Date.now()}`,
              deliveryAddress: fullAddress,
              status: "failed",
            });

            console.log(
              "Logged failed private network redemption to database:",
              {
                amount: form.quantity,
                errorMessage: result.message,
              },
            );
          } catch (dbError) {
            console.error("Failed to log failed redemption:", dbError);
          }
        }
      } catch (error: any) {
        console.error("Private network redemption failed:", error);
        toast({
          title: t("redemption.errorTitle"),
          description: t("redemption.networkError"),
          variant: "destructive",
        });

        // Log failed private network redemption to database
        try {
          await createRedemption({
            ...form,
            token: form.token.toLowerCase(),
            network:
              form.network === "Private"
                ? "canton"
                : form.network === "Ethereum"
                  ? "public"
                  : "solana",
            walletAddress: "",
            transactionHash: `failed-private-${Date.now()}`,
            deliveryAddress: fullAddress,
            status: "failed",
          });
        } catch (dbError) {
          console.error("Failed to log failed redemption:", dbError);
        }
      } finally {
        setIsPrivateRedemptionLoading(false);
      }
    }
  };

  const handleCancelRedemption = async (redemption: any) => {
    try {
      // Validate redemption object and ID (check both _id and id for compatibility)
      const redemptionId = redemption._id;
      if (!redemption || !redemptionId) {
        console.error("Invalid redemption object:", redemption);
        toast({
          title: t("redemption.cancelError"),
          description: t("toasts.invalidRedemptionData"),
          variant: "destructive",
        });
        return;
      }

      setCancellingRedemption(redemptionId);

      // Skip wallet validation for Private network redemptions
      if (redemption.network !== "canton") {
        // Check if wallet is connected for non-Private networks
        if (!address) {
          toast({
            title: t("redemption.walletNotConnected"),
            description: t("redemption.connectWalletToCancel"),
            variant: "destructive",
          });
          setCancellingRedemption(null);
          return;
        }

        // Check if wallet address matches the redemption wallet address
        if (redemption.walletAddress && redemption.walletAddress !== address) {
          toast({
            title: t("redemption.wrongWallet"),
            description: t("redemption.connectCorrectWallet", {
              walletAddress: redemption.walletAddress,
            }),
            variant: "destructive",
          });
          setCancellingRedemption(null);
          return;
        }
      }

      console.log("Starting cancellation for redemption:", {
        id: redemptionId,
        network: redemption.network,
        requestId: redemption.requestId,
        walletAddress: redemption.walletAddress,
        currentAddress: address,
        status: redemption.status,
      });

      // Enforce blockchain-first approach: Only allow database updates after successful blockchain transactions
      console.log("=== BLOCKCHAIN-FIRST CANCELLATION LOGIC ===");

      // Network-specific cancellation logic with transaction-first approach
      let blockchainTransactionSuccessful = false;

      if (redemption.network === "solana") {
        // For Solana network: first try blockchain cancellation, then update database
        if (redemption.requestId && redemption.requestId !== "0") {
          try {
            // Call Solana blockchain cancel function using requestId - MUST succeed for status update
            console.log(
              "Calling Solana cancellation with requestId:",
              redemption.requestId,
            );

            try {
              const cancelRedemption =
                redemption.token === "GOLD"
                  ? solanaGoldRedemptionHook.cancelRedemption
                  : solanaSilverRedemptionHook.cancelRedemption;
              const result = await cancelRedemption(
                redemption.requestId,
                setCancelSolRedemption,
              );

              // If result is null, it means there was an error and toast was already shown
              if (!result) {
                setCancellingRedemption(null); // Reset state on error
                return; // Stop execution
              }

              blockchainTransactionSuccessful = true;
              console.log(
                "Solana blockchain cancellation successful for requestId:",
                redemption.requestId,
              );
            } catch (error) {
              console.error("Solana cancellation failed:", error);
              setCancellingRedemption(null); // Reset state on error
              return; // Stop execution - blockchain transaction required
            }
          } catch (blockchainError: any) {
            console.error(
              "Solana blockchain cancellation failed for requestId:",
              redemption.requestId,
              blockchainError,
            );
            toast({
              title: t("redemption.cancelError"),
              description: `Blockchain transaction failed: ${blockchainError?.message || "Unknown error"}`,
              variant: "destructive",
            });
            setCancellingRedemption(null); // Reset state on error
            return; // Stop execution if blockchain fails
          }
        } else {
          // No requestId - this is a pending redemption, still need blockchain transaction for Solana
          console.log(
            "Solana redemption without requestId - cannot cancel on blockchain without requestId",
          );
          toast({
            title: t("redemption.cancelError"),
            description:
              "Cannot cancel Solana redemption without valid requestId",
            variant: "destructive",
          });
          setCancellingRedemption(null); // Reset state on error
          return; // Stop execution - blockchain transaction required
        }
      } else if (redemption.network === "public") {
        // For Ethereum network: first try blockchain cancellation, then update database
        if (redemption.requestId && redemption.requestId !== "0") {
          // Determine which hook to use based on token type
          const hookToUse =
            redemption.token === "GOLD"
              ? goldRedemptionHook
              : silverRedemptionHook;

          try {
            // Call Ethereum blockchain cancel function using requestId - MUST succeed for status update
            console.log(
              "Calling Ethereum cancellation with requestId:",
              redemption.requestId,
            );

            // Start the blockchain transaction
            await hookToUse.cancelRedemptionRequest({
              requestId: redemption.requestId,
            });

            console.log(
              "Ethereum blockchain transaction initiated, waiting for confirmation...",
            );

            toast({
              title: t("toasts.transactionSubmitted"),
              description: t("toasts.waitingForConfirmation"),
            });

            // Store the redemption data for later database update when transaction is confirmed
            setPendingCancelRedemption({
              redemptionId,
              redemption,
              address,
              hookToUse,
            });

            // Don't reset cancellingRedemption here - it will be reset when transaction completes or fails
            // Don't proceed with database update here - it should happen when transaction is confirmed
            return; // Exit here, database update will happen via useEffect
          } catch (blockchainError: any) {
            console.error(
              "Ethereum blockchain cancellation failed for requestId:",
              redemption.requestId,
              blockchainError,
            );
            toast({
              title: t("redemption.cancelError"),
              description: `Blockchain transaction failed: ${blockchainError?.message || "Unknown error"}`,
              variant: "destructive",
            });
            setCancellingRedemption(null); // Reset state on error
            return; // Stop execution if blockchain fails
          }
        } else {
          // No requestId - this is a pending redemption, still need blockchain transaction for Ethereum
          console.log(
            "Ethereum redemption without requestId - cannot cancel on blockchain without requestId",
          );
          toast({
            title: t("redemption.cancelError"),
            description:
              "Cannot cancel Ethereum redemption without valid requestId",
            variant: "destructive",
          });
          setCancellingRedemption(null); // Reset state on error
          return; // Stop execution - blockchain transaction required
        }
      } else {
        // For Private network: Use DAML cancel redemption API
        if (redemption.network === "canton") {
          try {
            console.log("Private network redemption - calling DAML cancel API");

            // Extract contractId from redemption - this should be available in redemption data
            const contractId = redemption.transactionHash;

            if (!contractId) {
              console.error("No contractId available for DAML cancellation");
              toast({
                title: t("redemption.cancelError"),
                description:
                  "Contract ID is required for private network cancellation",
                variant: "destructive",
              });
              setCancellingRedemption(null);
              return;
            }

            // Call the DAML cancel redemption API using the apiRequest function
            const response = await apiRequest(
              "POST",
              "/api/daml/cancel-redemption",
              {
                contractId: contractId,
              },
            );

            const result = await response.json();

            console.log("DAML cancellation successful:", result);
            blockchainTransactionSuccessful = true;

            toast({
              title: t("redemption.cancelSuccess"),
              description: "Private network redemption cancelled successfully",
            });
          } catch (damlError: any) {
            console.error("DAML cancellation failed:", damlError);
            toast({
              title: t("redemption.cancelError"),
              description: `Private network cancellation failed: ${damlError?.message || "Unknown error"}`,
              variant: "destructive",
            });
            setCancellingRedemption(null);
            return;
          }
        } else {
          // Other unknown networks - default to requiring blockchain transaction
          console.log(
            "Unknown network type - cannot cancel without blockchain transaction",
          );
          toast({
            title: t("redemption.cancelError"),
            description: t("toasts.unknownNetworkType"),
            variant: "destructive",
          });
          setCancellingRedemption(null); // Reset state on error
          return;
        }
      }

      // Only update database status if blockchain transaction was successful (or not required)
      console.log("=== DATABASE UPDATE PHASE ===");
      console.log(
        "Blockchain transaction successful:",
        blockchainTransactionSuccessful,
      );

      if (blockchainTransactionSuccessful) {
        console.log("Proceeding with database status update to 'cancelled'");
        const success = await updateRedemption(
          redemptionId,
          { status: "cancelled" },
          redemption.network === "Private"
            ? redemption.walletAddress || ""
            : address,
        );

        if (success) {
          console.log("Database update successful - invalidating cache");
          invalidateRedemptions();
          toast({
            title: t("redemption.cancelSuccess"),
            description: t("redemption.cancelSuccess"),
          });
        } else {
          console.error("Database update failed");
          toast({
            title: t("redemption.cancelError"),
            description: t("toasts.databaseUpdateFailed"),
            variant: "destructive",
          });
        }
      } else {
        console.log("Blockchain transaction failed - skipping database update");
      }
    } catch (error) {
      console.error("Cancel redemption error:", error);
      toast({
        title: t("redemption.cancelError"),
        description: t("redemption.cancelError"),
        variant: "destructive",
      });
    } finally {
      // Only reset these states if we're not waiting for Ethereum transaction confirmation
      if (!pendingCancelRedemption) {
        setCancellingRedemption(null);
      }
    }
  };

  const isFormValid = () => {
    return (
      validQuantity &&
      form.streetAddress.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.zipCode.trim() &&
      form.country.trim()
    );
  };

  console.log("dtate", cancelSolRedemption, pendingCancelRedemption);
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-brown dark:text-brand-gold">
          {t("redemption.title")}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          {t("redemption.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Redemption Form */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t("redemption.redemptionRequest")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Token Selection */}
              <div>
                <Label htmlFor="token" className="text-sm sm:text-base">
                  {t("redemption.selectToken")}
                </Label>
                <Select
                  value={form.token}
                  onValueChange={(value) =>
                    setForm({ ...form, token: value as "GOLD" | "SILVER" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("redemption.selectTokenPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOLD">
                      {t("redemption.goldGRT")}
                    </SelectItem>
                    <SelectItem value="SILVER">
                      {t("redemption.silverSRT")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity" className="text-sm sm:text-base">
                  {t("redemption.quantity")}
                </Label>
                <Input
                  type="number"
                  name="quantity"
                  placeholder={t("redemption.quantityPlaceholder")}
                  value={form.quantity}
                  onChange={handleChange}
                  min="0.000001"
                  step="0.000001"
                />
                {form.quantity && validQuantity && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t("redemption.quantityInfo", {
                      grams: getGrams(),
                      metal: t(`redemption.${form.token.toLowerCase()}`),
                      value: getUSDValue().toFixed(2),
                    })}
                  </p>
                )}
                {form.quantity && !validQuantity && (
                  <p className="text-sm text-red-600 mt-1">
                    {t("redemption.quantityInvalid")}
                  </p>
                )}
              </div>

              {/* Network */}
              <div>
                <Label htmlFor="network" className="text-sm sm:text-base">
                  {t("redemption.network")}
                </Label>
                <Select
                  value={form.network}
                  onValueChange={(value) =>
                    setForm({ ...form, network: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("redemption.networkPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ethereum">
                      {/* {t("redemption.ethereum")} */}
                      Polygon
                    </SelectItem>
                    <SelectItem value="Solana">
                      {t("redemption.solana")}
                    </SelectItem>
                    <SelectItem value="Private">
                      {/* {t("redemption.private")} */}
                      Canton
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm sm:text-base">
                  {t("redemption.deliveryAddress")}
                </h3>

                <div>
                  <Label
                    htmlFor="streetAddress"
                    className="text-sm sm:text-base"
                  >
                    {t("redemption.streetAddress")}
                  </Label>
                  <Input
                    name="streetAddress"
                    placeholder={t("redemption.streetAddressPlaceholder")}
                    value={form.streetAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm sm:text-base">
                      {t("redemption.city")}
                    </Label>
                    <Input
                      name="city"
                      placeholder={t("redemption.cityPlaceholder")}
                      value={form.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-sm sm:text-base">
                      {t("redemption.zipCode")}
                    </Label>
                    <Input
                      name="zipCode"
                      placeholder={t("redemption.zipCodePlaceholder")}
                      value={form.zipCode}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country" className="text-sm sm:text-base">
                    {t("redemption.country")}
                  </Label>
                  <Select
                    value={form.country}
                    onValueChange={(value) =>
                      setForm({ ...form, country: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("redemption.countryPlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.isoCode} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.country && (
                  <div>
                    <Label htmlFor="state" className="text-sm sm:text-base">
                      {t("redemption.state")}
                    </Label>
                    <Select
                      value={form.state}
                      onValueChange={(value) =>
                        setForm({ ...form, state: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("redemption.statePlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.isoCode} value={state.name}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Blockchain Status Alerts */}
              {form.network === "Ethereum" && (
                <>
                  {redemptionError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t("redemption.blockchainError", {
                          error: redemptionError.message,
                        })}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isPending && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        {t("redemption.confirmTransaction")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isConfirming && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        {t("redemption.transactionSubmitted")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {isConfirmed && transactionHash && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t("redemption.transactionConfirmed", {
                          hash: transactionHash,
                        })}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  !isFormValid() ||
                  isPending ||
                  isConfirming ||
                  isLoading ||
                  isPrivateRedemptionLoading
                }
                data-testid="button-submit-redemption"
              >
                {isPending ||
                isConfirming ||
                isLoading ||
                isSolanaRedemption ||
                isPrivateRedemptionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {form.network === "Solana"
                      ? t("redemption.processing")
                      : t("redemption.processing")}
                  </>
                ) : (
                  t("redemption.submitRedemptionRequest")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        {form.quantity && validQuantity && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                {t("redemption.costBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>{t("redemption.tokenValue")}:</span>
                <span>${getUSDValue().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("redemption.networkFee")}:</span>
                <span>
                  $
                  {networkFees[
                    form.network as keyof typeof networkFees
                  ].fee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("redemption.deliveryFee")}:</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>{t("redemption.totalCost")}:</span>
                <span>
                  $
                  {(
                    getUSDValue() +
                    networkFees[form.network as keyof typeof networkFees].fee +
                    deliveryFee
                  ).toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t("redemption.quantityInfo", {
                  grams: getGrams(),
                  metal: t(`redemption.${form.token.toLowerCase()}`),
                  value: "",
                })
                  .split("•")[0]
                  .trim()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Redemption History */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t("redemption.redemptionHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="min-w-[800px] sm:min-w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.date")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.token")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.quantity")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.status")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.network")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden lg:table-cell">
                          {t("redemption.address")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden md:table-cell">
                          {t("redemption.txHash")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.action")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 10 }).map((_, index) => (
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
                            <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <Skeleton className="h-5 sm:h-6 w-12 sm:w-16 rounded-full" />
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                            <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : typedRedemptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("redemption.noRedemptionHistory")}</p>
                <p className="text-sm">{t("redemption.loadingHistory")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="min-w-[800px] sm:min-w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.date")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.token")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.quantity")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.status")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.network")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden lg:table-cell">
                          {t("redemption.address")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm hidden md:table-cell">
                          {t("redemption.txHash")}
                        </th>
                        <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm">
                          {t("redemption.action")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {typedRedemptions.map((redemption: any) => (
                        <tr
                          key={redemption._id}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span className="text-xs sm:text-sm">
                              {formatDate(redemption.createdAt)}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                redemption.token === "gold"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {redemption.token.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span className="text-xs sm:text-sm">
                              {redemption.quantity}{" "}
                              {t("redemption.token").toLowerCase()}s
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                redemption.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : redemption.status === "confirmed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : redemption.status === "shipped"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                      : redemption.status === "delivered"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {t(`redemption.${redemption.status}`)}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              {redemption.network === "public"
                                ? "Polygon"
                                : redemption.network === "solana"
                                  ? "Solana"
                                  : "Canton"}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                            <span
                              className="text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                              title={redemption.deliveryAddress}
                            >
                              {redemption.deliveryAddress
                                ? redemption.deliveryAddress.length > 30
                                  ? `${redemption.deliveryAddress.slice(0, 30)}...`
                                  : redemption.deliveryAddress
                                : t("common.notAvailable")}
                            </span>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">
                            {redemption.transactionHash ? (
                              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                {redemption.transactionHash.slice(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {redemption?.network === "solana" ? (
                              <Button
                                size="sm"
                                variant={
                                  redemption.status === "pending"
                                    ? "destructive"
                                    : "secondary"
                                }
                                disabled={
                                  redemption.status !== "pending" ||
                                  pendingCancelRedemption?.redemptionId ===
                                    redemption._id ||
                                  cancelSolRedemption
                                }
                                onClick={() =>
                                  handleCancelRedemption(redemption)
                                }
                                data-testid={`button-cancel-redemption-${redemption._id || redemption.id}`}
                                className="h-6 sm:h-8 px-2 sm:px-3 text-xs"
                              >
                                {cancelSolRedemption &&
                                pendingCancelRedemption?.redemptionId ===
                                  redemption._id ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    <span className="hidden sm:inline">
                                      {t("redemption.processing")}
                                    </span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="hidden sm:inline">
                                      {t("redemption.cancelRedemption")}
                                    </span>
                                    <span className="sm:hidden">Cancel</span>
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant={
                                  redemption.status === "pending"
                                    ? "destructive"
                                    : "secondary"
                                }
                                disabled={
                                  redemption.status !== "pending" ||
                                  cancellingRedemption === redemption._id ||
                                  pendingCancelRedemption?.redemptionId ===
                                    redemption._id
                                }
                                onClick={() =>
                                  handleCancelRedemption(redemption)
                                }
                                data-testid={`button-cancel-redemption-${redemption._id || redemption.id}`}
                                className="h-6 sm:h-8 px-2 sm:px-3 text-xs"
                              >
                                {(cancellingRedemption === redemption._id ||
                                  pendingCancelRedemption?.redemptionId ===
                                    redemption._id) &&
                                (goldRedemptionHook?.isLoading ||
                                  goldRedemptionHook.isPending ||
                                  silverRedemptionHook?.isLoading ||
                                  silverRedemptionHook.isPending) ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    <span className="hidden sm:inline">
                                      {t("redemption.cancelRedemption")}
                                    </span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="hidden sm:inline">
                                      {t("redemption.cancelRedemption")}
                                    </span>
                                    <span className="sm:hidden">Cancel</span>
                                  </>
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
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
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              {t("redemption.successTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t("redemption.successDescription")}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-md">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t("redemption.txHash")}:
              </p>
              <p className="font-mono text-xs sm:text-sm break-all">
                {successTransactionHash}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}