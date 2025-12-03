import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Wallet,
  Check,
  Clock,
  Info,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import { Stepper, Step } from 'react-form-stepper';
// MoonPay integration now handled server-side
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  registerUserOnCanton,
  checkUsernameAvailability,
  allocateParty,
} from "@/api/mutations";
import { getUserProfile } from "@/api/queries";
import { useBothPricesQuery } from "@/queries/marketPrices";
import {
  usePurchaseHistoryQuery,
  usePlatformPurchasesQuery,
  type PurchaseHistoryRecord,
} from "@/queries/purchaseHistory";
import { usePlatformFeeQuery } from "@/hooks/usePlatformFee";
import {
  useTokenConversionQuery,
  calculateTokenAmount,
} from "@/hooks/useTokenConversion";
import { Pagination } from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "react-i18next";
// Removed TransakPayment import - using MoonPay instead
import { ENV } from "@shared/constants";
import HelioCheckout from "../HelioCheckout";
import ScrollToTop from "../ScrollToTop";
import { uuid } from "drizzle-orm/pg-core";
import { randomBytes, uuidV4 } from "ethers";
import axios from "../../lib/axios";

export function InvestmentsTab() {
  const { t } = useTranslation();
  const [selectedMetal, setSelectedMetal] = useState<"gold" | "silver">("gold");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [networkType, setNetworkType] = useState<
    "private" | "public" | "solana"
  >("private");
  const [paymentMethod, setPaymentMethod] = useState<"fiat" | "wallet">("fiat");
  const [showPrivateBlockchainModal, setShowPrivateBlockchainModal] =
    useState(false);
  const [username, setUsername] = useState("");
  const [isHelioCheck, setIsHelioCheck] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [currentPurchaseId, setCurrentPurchaseId] = useState<string | null>(
    null,
  );
  const [usernameValidation, setUsernameValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    error: string | null;
  }>({
    isChecking: false,
    isAvailable: null,
    error: null,
  });

  // Timer state for step 2 security
  const [timeRemaining, setTimeRemaining] = useState<number>(60); // 60 seconds
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);

  // MoonPay integration now handled server-side with direct redirects

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Username availability check mutation
  const usernameCheckMutation = useMutation({
    mutationFn: checkUsernameAvailability,
    onSuccess: (response: any) => {
      setUsernameValidation({
        isChecking: false,
        isAvailable: response.available,
        error: response.available ? null : "Username is not available",
      });
    },
    onError: (error: any) => {
      setUsernameValidation({
        isChecking: false,
        isAvailable: null,
        error: error?.message || "Error checking username availability",
      });
    },
  });

  // Debounced effect for username validation
  useEffect(() => {
    if (!username.trim() || username.length < 3) {
      setUsernameValidation({
        isChecking: false,
        isAvailable: null,
        error: null,
      });
      return;
    }

    setUsernameValidation({
      isChecking: true,
      isAvailable: null,
      error: null,
    });

    const timeout = setTimeout(() => {
      usernameCheckMutation.mutate({ username });
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [username]);

  // Timer effect for step 2 security
  useEffect(() => {
    if (currentStep === 2) {
      // Start timer when entering step 2
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowTimeoutDialog(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset timer when not on step 2
      setTimeRemaining(60);
    }
  }, [currentStep]);

  // Pagination state for purchase history
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(5); // Show 5 records per page in the dashboard

  // Fetch real purchase history data with pagination
  const {
    data: purchaseHistoryData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = usePurchaseHistoryQuery(currentPage, pageLimit);
  const {
    data: platformPurchasesData,
    isLoading: isLoadingPlatform,
    error: platformError,
  } = usePlatformPurchasesQuery();

  // Extract purchase history or use empty array
  const purchaseHistory = purchaseHistoryData?.data?.purchases || [];
  const pagination = purchaseHistoryData?.data?.pagination || {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };
  const platformPurchases = platformPurchasesData?.data?.purchases || [];

  // Fetch live market data from Gold API
  const {
    data: marketPricesData,
    isLoading: isLoadingPrices,
    error: pricesError,
  } = useBothPricesQuery();

  // Fetch user profile to check if username and partyId already exist
  const { data: userProfile } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: () => getUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract live market data or use fallback values
  const marketData = {
    gold: {
      price: marketPricesData?.data?.gold?.price_gram_24k || 108.87,
      change: marketPricesData?.data?.gold?.change || 0,
    },
    silver: {
      price: marketPricesData?.data?.silver?.price_gram_24k || 21.22,
      change: marketPricesData?.data?.silver?.change || 0,
    },
  };

  const usdcBalance = 5000.0;

  // Fetch dynamic platform fee from API
  const {
    data: platformFeeData,
    isLoading: isLoadingPlatformFee,
    error: platformFeeError,
  } = usePlatformFeeQuery();

  // Fetch dynamic token conversion values from API
  const {
    data: tokenConversionData,
    isLoading: isLoadingTokenConversion,
    error: tokenConversionError,
  } = useTokenConversionQuery();

  // Use dynamic platform fee or fallback to 0%
  const platformFeePercent = platformFeeData?.data?.transferFeePercent || 0;
  const platformFee = platformFeePercent / 100; // Convert percentage to decimal

  const usdAmount = amount ? parseFloat(amount) : 0;
  const feeAmount = usdAmount * platformFee;
  const netAmount = usdAmount - feeAmount;

  // Calculate tokens using dynamic conversion values
  const mgPerToken =
    tokenConversionData?.data?.[selectedMetal]?.mgPerToken ||
    (selectedMetal === "gold" ? 10 : process.env.SILVER_MG_PER_TOKEN);
  const estimatedTokenAmount =
    amount && selectedMetal
      ? calculateTokenAmount(
          netAmount,
          marketData[selectedMetal].price,
          Number(mgPerToken),
        )
      : 0;

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  // Canton party allocation mutation (now handles both party allocation and user creation automatically)
  const allocatePartyMutation = useMutation({
    mutationFn: allocateParty,
    onSuccess: async (response: any) => {
      console.log(
        "Party allocation and Canton user creation success:",
        response,
      );

      toast({
        title: t("dashboard.registrationSuccessful"),
        description: "Successfully joined the private blockchain network!",
        duration: 5000,
      });
      setShowPrivateBlockchainModal(false);
      setUsername(""); // Reset form

      // Invalidate and refetch user profile to get updated data
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
    onError: (error: any) => {
      console.error("Party allocation error:", error);
      toast({
        title: "Registration Failed",
        description:
          error?.message || "Failed to allocate party in Canton network",
        duration: 5000,
        variant: "destructive",
      });
    },
  });
  const checkKycStatus = async () => {
    try {
      const response = await axios.get('/api/kyc/status');
      if (response.data.success) {
        console.log('KYC status:', response.data.kycStatus);
        return response.data.kycStatus;
      }
    } catch (error: any) {
      console.error('Error fetching KYC status:', error);
    }
  };
  const handleConfirmPayment = async () => {
    setIsDisabled(true);
    // For fiat payments, create purchase record and redirect to OnRamper
    const kycStatus = await checkKycStatus();
    if (kycStatus === 'not_started' || kycStatus === 'pending' || kycStatus === 'review' || kycStatus === 'rejected') {
      toast({
        title: "KYC Required",
        description: "Please complete your KYC verification before making any investments.",
        variant: "destructive",
      });
      setIsDisabled(false);
      return;
    }
      try {
        console.log(
          "Creating purchase record for OnRamper payment",
          paymentMethod,
        );

        // Create purchase history record first
        const purchaseResponse = await fetch("/api/purchase-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.token || ""}`,
          },
          body: JSON.stringify({
            metal: selectedMetal,
            tokenAmount: estimatedTokenAmount.toFixed(0),
            usdAmount: netAmount.toFixed(2),
            feeAmount: feeAmount.toFixed(2),
            date: new Date().toISOString().split("T")[0],
            time: new Date().toTimeString().split(" ")[0],
            status: "initiated",
            networkType:
              networkType === "solana"
                ? "solana"
                : networkType === "private"
                  ? "canton"
                  : "public",
            paymentMethod: paymentMethod === "fiat" ? "fiat" : "wallet",
            walletAddress:
              networkType === "private" ? "private-blockchain" : walletAddress,
            currentTokenPrice: marketData[selectedMetal].price.toFixed(2),
            ...(paymentMethod === "fiat" && { useMoonPay: true }),
          }),
        });

        if (!purchaseResponse.ok) {
          throw new Error("Failed to create purchase record");
        }

        const purchaseData = await purchaseResponse.json();
        const purchaseHistoryId = purchaseData.data._id;

        // console.log("Purchase record created:", paymentMethod);

        // For MoonPay (fiat) payments, get signed URL from server and redirect
        if (paymentMethod === "fiat") {
          const moonpayResponse = await fetch(
            "/api/moonpay/create-payment-url",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.token || ""}`,
              },
              body: JSON.stringify({
                currencyCode: "usdc_sepolia",
                baseCurrencyAmount: parseFloat(amount),
                baseCurrencyCode: "usd",
                walletAddress: "0xaB4dbDD5Fb141E08Da7b3E77C08fc706aF2D1Fcc", // Admin wallet
                externalTransactionId: purchaseHistoryId,
                redirectURL: window.location.origin + "/assets", // Return to dashboard after payment
              }),
            },
          );

          if (!moonpayResponse.ok) {
            throw new Error("Failed to create MoonPay payment URL");
          }

          const moonpayData = await moonpayResponse.json();
          console.log('MoonPay data:', moonpayData)
          // Redirect to MoonPay payment page
          window.open(moonpayData.data.paymentUrl, "_self");
          toast({
            title: "Payment Initiated",
            description:
              "You've been redirected to MoonPay for payment. The page will update when payment is complete.",
          });
        }
        else {
          // For wallet payments, create purchase record first, then show Helio
          try {
            // Store the purchase ID and show Helio checkout
            // setCurrentPurchaseId(purchaseHistoryId);
            setIsHelioCheck(true);
          setIsDisabled(false);
          } catch (error) {
            console.error("Error creating wallet purchase record:", error);
          setIsDisabled(false);
            toast({
              title: "Error",
              description: "Failed to initiate wallet payment. Please try again.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error creating Transak purchase:", error);
        setIsDisabled(false);
        toast({
          title: "Error",
          description: "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
      }
  };

  const handleBackToStep = (step: 1 | 2) => {
    setCurrentStep(step);
  };

  const handleJoinPrivateBlockchain = () => {
    if (!user) {
      toast({
        title: t("dashboard.authenticationRequired"),
        description: t("dashboard.loginRequiredForPrivateNetwork"),
        variant: "destructive",
      });
      return;
    }

    // Start the Canton registration flow with party allocation
    allocatePartyMutation.mutate({
      identifierHint: username,
      displayName: username,
    });
  };

  // Status helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "completed":
        return t("dashboard.completed");
      case "processing":
        return t("dashboard.processing");
      case "pending":
        return t("dashboard.pending");
      default:
        return status;
    }
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

  // Progress bar steps
  const steps = [
    {
      id: 1,
      title: t("dashboard.purchaseSummary"),
      description: t("dashboard.reviewOrder"),
    },
    {
      id: 2,
      title: t("dashboard.paymentMethod"),
      description: t("dashboard.completePayment"),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Section - Two Columns */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Purchase Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.buyPreciousMetals")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Horizontal Progress Bar with react-form-stepper */}
            {currentStep > 1 && (
              <div className="mb-6">
                <Stepper
                  activeStep={currentStep - 1}
                  styleConfig={{
                    activeBgColor: '#CF9531',
                    activeTextColor: '#ffffff',
                    completedBgColor: '#CF9531',
                    completedTextColor: '#ffffff',
                    inactiveBgColor: '#e5e7eb',
                    inactiveTextColor: '#6b7280',
                    size: '2em',
                    circleFontSize: '1rem',
                    labelFontSize: '0.875rem',
                    borderRadius: '50%',
                    fontWeight: 500,
                  }}
                  connectorStyleConfig={{
                    activeColor: '#CF9531',
                    completedColor: '#CF9531',
                    disabledColor: '#d1d5db',
                    size: 2,
                    stepSize: '2em',
                    style: 'solid',
                  }}
                >
                  {steps.map((step) => (
                    <Step key={step.id} label={step.title} />
                  ))}
                </Stepper>
              </div>
            )}

            <form onSubmit={handlePurchase} className="space-y-6">
              {/* Metal Selection - Only show in step 1 */}
              {currentStep === 1 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {t("dashboard.selectMetal")}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMetal("gold")}
                      className={`flex items-center justify-center p-4 border-2 rounded-xl transition-colors ${
                        selectedMetal === "gold"
                          ? "border-brand-dark-gold bg-brand-gold/10 dark:bg-brand-gold/5"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 bg-brand-gold/20 dark:bg-brand-gold/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-brand-dark-gold dark:text-brand-gold text-sm font-bold">
                            Au
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {t("dashboard.gold")}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMetal("silver")}
                      className={`flex items-center justify-center p-4 border-2 rounded-xl transition-colors ${
                        selectedMetal === "silver"
                          ? "border-brand-dark-gold bg-brand-gold/10 dark:bg-brand-gold/5"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-brand-brown dark:text-gray-300 text-sm font-bold">
                            Ag
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {t("dashboard.silver")}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Network Selection - Only show in step 1 */}
              {currentStep === 1 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    {t("dashboard.selectNetwork")}
                  </Label>
                  <Select
                    value={networkType}
                    onValueChange={(value: "private" | "public" | "solana") =>
                      setNetworkType(value)
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
              )}

              {/* Wallet Address Input - Only show in step 1 and when not private network */}
              {currentStep === 1 && networkType !== "private" && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="wallet-address">
                      {t("dashboard.walletAddress")}
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-brand-brown hover:text-brand-dark-gold dark:text-brand-gold dark:hover:text-brand-gold/80 cursor-default" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="max-w-xs">
                            {t("dashboard.walletAddressTooltip")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="text"
                    id="wallet-address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="mt-1"
                    placeholder={t("dashboard.enterWalletAddress")}
                    required
                  />
                </div>
              )}

              {/* Amount Input - Only show in step 1 */}
              {currentStep === 1 && (
                <div>
                  <Label htmlFor="purchase-amount">
                    {t("dashboard.usdAmount")}
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                        $
                      </span>
                    </div>
                    <Input
                      type="number"
                      id="purchase-amount"
                      value={amount}
                      onChange={(e) => {
                        let value = e.target.value;

                        // allow empty while typing
                        if (value === "") {
                          setAmount("");
                          return;
                        }
                    
                        let num = Number(value);
                    
                        // block negative and zero
                        if (num <= 0) {
                          setAmount("");
                          return;
                        }
                    
                        // enforce minimum 10
                        if (num < 1) {
                          setAmount("1");
                          return;
                        }
                    
                        setAmount(num.toString());
                      }}
                      className="pl-7 pr-12"
                      placeholder="0.00"
                      min="10"
                      step="0.01"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                        USD
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {/* <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Balance: ${usdcBalance.toLocaleString()}</span>
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-xs text-brand-dark-gold dark:text-brand-gold hover:text-brand-brown dark:hover:text-brand-gold/80"
                        onClick={() => setAmount(usdcBalance.toString())}
                      >
                        Use Max
                      </Button>
                    </div> */}
                    {/* <div className="text-xs text-gray-500 dark:text-gray-400">
                      Platform fee: {platformFeePercent}% • Min. purchase: $10
                    </div> */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Min. purchase: $10
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Content Area - All steps show here */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                {/* Step 1: Purchase Summary */}
                {currentStep === 1 && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                      {t("dashboard.purchaseSummary")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.livePrice")}{" "}
                          {selectedMetal === "gold"
                            ? t("dashboard.gold")
                            : t("dashboard.silver")}{" "}
                          {t("dashboard.pricePerGram")}
                        </span>
                        <div className="flex items-center gap-2">
                          {isLoadingPrices ? (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t("dashboard.loading")}
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                ${marketData[selectedMetal].price.toFixed(2)}
                                /gram
                              </span>
                              {marketData[selectedMetal].change !== 0 && (
                                <div
                                  className={`flex items-center gap-1 text-xs ${
                                    marketData[selectedMetal].change > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {marketData[selectedMetal].change > 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {Math.abs(
                                    marketData[selectedMetal].change,
                                  ).toFixed(2)}
                                  %
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {amount && parseFloat(amount) > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t("dashboard.usdAmount")}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              ${usdAmount.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Platform Fee ({platformFeePercent}%)
                            </span>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              -${feeAmount.toFixed(2)}
                            </span>
                          </div>

                          <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {t("dashboard.netAmount")}
                              </span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                ${netAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-brand-gold/10 dark:bg-brand-gold/5 rounded-lg p-3 border border-brand-gold/20">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-brand-dark-gold dark:text-brand-gold">
                                {t("dashboard.estimatedTokenAmount")}
                              </span>
                              <span className="text-sm font-bold text-brand-dark-gold dark:text-brand-gold">
                                ~{estimatedTokenAmount.toFixed(2)} tokens (1
                                token ={" "}
                                {tokenConversionData?.data?.[selectedMetal]
                                  ?.displayText ||
                                  `${selectedMetal === "gold" ? process.env.GOLD_MG_PER_TOKEN : `${process.env.SILVER_MG_PER_TOKEN}`}mg (milligrams) of ${selectedMetal}`}
                                )
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Step 2: Payment Method */}
                {currentStep === 2 && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Select Payment Method
                      </h3>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <Clock className={`w-4 h-4 ${timeRemaining <= 10 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        <span className={`text-sm font-semibold ${timeRemaining <= 10 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total Amount
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${netAmount.toFixed(2)}
                        </span>
                      </div>

                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value: "fiat" | "wallet") =>
                          setPaymentMethod(value)
                        }
                      >
                        <div className="space-y-3">
                          <div
                            className="flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                            style={{
                              borderColor:
                                paymentMethod === "fiat"
                                  ? "var(--brand-dark-gold)"
                                  : "var(--border)",
                              backgroundColor:
                                paymentMethod === "fiat"
                                  ? "rgba(207, 149, 49, 0.05)"
                                  : "transparent",
                            }}
                          >
                            <RadioGroupItem value="fiat" id="fiat" />
                            <Label
                              htmlFor="fiat"
                              className="flex items-center space-x-3 cursor-pointer flex-1"
                            >
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  Pay with Fiat
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Credit/Debit Card, Bank Transfer
                                </div>
                              </div>
                            </Label>
                          </div>

                          <div
                            className="flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                            style={{
                              borderColor:
                                paymentMethod === "wallet"
                                  ? "var(--brand-dark-gold)"
                                  : "var(--border)",
                              backgroundColor:
                                paymentMethod === "wallet"
                                  ? "rgba(207, 149, 49, 0.05)"
                                  : "transparent",
                            }}
                          >
                            <RadioGroupItem value="wallet" id="wallet" />
                            <Label
                              htmlFor="wallet"
                              className="flex items-center space-x-3 cursor-pointer flex-1"
                            >
                              <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <Wallet className="w-4 h-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  Pay with Wallet
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  USDC, Ether, Bitcoin
                                </div>
                              </div>
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                  <div className="flex space-x-3">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          handleBackToStep((currentStep - 1) as 1 | 2)
                        }
                        className="flex-1"
                      >
                        {t("common.back")}
                      </Button>
                    )}

                    {currentStep === 1 && (
                      <Button
                        type="submit"
                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                        disabled={
                          Number(amount) < 10 ||
                          (networkType !== "private" && !walletAddress)
                        }
                      >
                        Continue to Payment
                      </Button>
                    )}

                    {currentStep === 2 && (
                      <>
                        <ScrollToTop />
                        <Button
                          type="button"
                          onClick={handleConfirmPayment}
                          disabled={isLoadingHistory || isDisabled}
                          className="w-full bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                        >
                          {isLoadingHistory
                            ? t("common.processing")
                            : t("dashboard.confirmPayment")}
                        </Button>
                      </>
                    )}
                    <>
                      {isHelioCheck && (
                        <HelioCheckout
                          amount={amount}
                          isOpen={isHelioCheck}
                          onClose={() => {
                            setIsHelioCheck(false);
                            setCurrentPurchaseId(null);
                          }}
                          purchaseId={currentPurchaseId || undefined}
                        />
                      )}
                    </>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Market Data & Platform Purchases */}
        <div className="space-y-6">
          {/* Live Prices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t("dashboard.liveMarketPrices")}
                {isLoadingPrices && (
                  <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pricesError ? (
                <div className="text-center p-4 text-red-600 dark:text-red-400">
                  <p className="text-sm">
                    {t("dashboard.unableToFetchLivePrices")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("dashboard.usingFallbackData")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-brand-gold/20 dark:bg-brand-gold/30 rounded-full flex items-center justify-center">
                        <span className="text-brand-dark-gold dark:text-brand-gold text-sm font-bold">
                          Au
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t("dashboard.gold")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          XAU/USD • 24k per gram
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isLoadingPrices ? (
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${marketData.gold.price.toFixed(2)}
                        </div>
                      )}
                      {!isLoadingPrices && marketData.gold.change !== 0 && (
                        <div
                          className={`flex items-center justify-end gap-1 text-xs ${
                            marketData.gold.change > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {marketData.gold.change > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {marketData.gold.change > 0 ? "+" : ""}
                          {marketData.gold.change.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-brand-brown dark:text-gray-300 text-sm font-bold">
                          Ag
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t("dashboard.silver")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          XAG/USD • 24k per gram
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isLoadingPrices ? (
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${marketData.silver.price.toFixed(2)}
                        </div>
                      )}
                      {!isLoadingPrices && marketData.silver.change !== 0 && (
                        <div
                          className={`flex items-center justify-end gap-1 text-xs ${
                            marketData.silver.change > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {marketData.silver.change > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {marketData.silver.change > 0 ? "+" : ""}
                          {marketData.silver.change.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {marketPricesData?.data && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated:{" "}
                    {new Date(
                      marketPricesData.data.gold.timestamp,
                    ).toLocaleTimeString()}
                  </p>
                  {/* <p className="text-xs text-gray-400 dark:text-gray-500">
                    Data provided by Gold API
                  </p> */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Purchases */}
          
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.platformPurchases")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-3">
                {isLoadingPlatform ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      Loading platform purchases...
                    </span>
                  </div>
                ) : platformError ? (
                  <div className="text-center p-4 text-red-600 dark:text-red-400">
                    <p className="text-sm">
                      {t("dashboard.failedToLoadPlatformPurchases")}
                    </p>
                  </div>
                ) : platformPurchases.length === 0 ? (
                  <div className="text-center p-4 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No platform purchases found</p>
                  </div>
                ) : (
                  platformPurchases.map((purchase: PurchaseHistoryRecord) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            purchase.metal === "gold"
                              ? "bg-brand-gold/20 dark:bg-brand-gold/30"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            className={`text-xs font-bold ${
                              purchase.metal === "gold"
                                ? "text-brand-dark-gold dark:text-brand-gold"
                                : "text-brand-brown dark:text-gray-300"
                            }`}
                          >
                            {purchase.metal === "gold" ? "Au" : "Ag"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {parseFloat(purchase.tokenAmount).toFixed(2)} tokens ({(parseFloat(purchase.tokenAmount) * (purchase.metal === "gold" ? parseInt(process.env.GOLD_MG_PER_TOKEN || "10") : parseInt(process.env.SILVER_MG_PER_TOKEN || "10"))).toFixed(2)}mg of {purchase.metal})
                            {/* (1 token ={" "}
                            {purchase.metal === "gold"
                              ? GOLD_MG_PER_TOKEN || "10"
                              : SILVER_MG_PER_TOKEN || "10"}
                            mg of {purchase.metal}) */}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {purchase.date} • {purchase.time}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${parseFloat(purchase.usdAmount).toFixed(2)}
                        </div>
                        {/* <div className="text-xs text-gray-500 dark:text-gray-400">
                          Fee: ${parseFloat(purchase.feeAmount).toFixed(2)}
                        </div> */}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card> 

        </div>
      </div>

      {/* Purchase History Table - Full Width Below Both Columns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t("dashboard.purchaseHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingHistory ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.metal")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.tokenAmount")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.usdAmount")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.fee")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.date")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.network")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.payment")}
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      {t("dashboard.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Skeleton loader rows */}
                  {Array.from({ length: 5 }, (_, index) => (
                    <tr
                      key={`skeleton-${index}`}
                      className="border-b border-gray-100 dark:border-gray-800 animate-pulse"
                    >
                      <td className="py-3 px-4">
                        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-6 w-18 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : historyError ? (
            <div className="text-center p-8 text-red-600 dark:text-red-400">
              <p className="text-sm">
                {t("dashboard.failedToLoadPurchaseHistory")}
              </p>
            </div>
          ) : purchaseHistory.length === 0 ? (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">{t("dashboard.noPurchaseHistoryFound")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.metal")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.tokenAmount")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.usdAmount")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.fee")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.date")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.network")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.payment")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        {t("dashboard.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.map((purchase) => (
                      <tr
                        key={purchase.id}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              purchase.metal === "gold"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                            }`}
                          >
                            {purchase.metal.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {parseFloat(purchase.tokenAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          ${parseFloat(purchase.usdAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          ${parseFloat(purchase.feeAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {purchase.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {purchase.networkType === "public"
                              ? "Polygon"
                              : purchase.networkType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {purchase.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              purchase.status,
                            )}`}
                          >
                            {getStatusDisplay(purchase.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Component */}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Private Blockchain Modal */}
      <Dialog
        open={showPrivateBlockchainModal}
        onOpenChange={setShowPrivateBlockchainModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Join Private Blockchain Network
            </DialogTitle>
            <DialogDescription>
              Register for our secure private blockchain network to enable
              enhanced security features and exclusive investment opportunities.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Private Network Benefits:
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Enhanced security and privacy</li>
                  <li>• Exclusive investment opportunities</li>
                  <li>• Priority customer support</li>
                  <li>• Advanced portfolio analytics</li>
                </ul>
              </div>

              <div>
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pr-10"
                    required
                    data-testid="input-username"
                  />
                  {/* Validation feedback icons */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {usernameValidation.isChecking && (
                      <Loader2
                        className="h-4 w-4 animate-spin text-gray-400"
                        data-testid="loader-username-check"
                      />
                    )}
                    {!usernameValidation.isChecking &&
                      usernameValidation.isAvailable === true && (
                        <Check
                          className="h-4 w-4 text-green-500"
                          data-testid="icon-username-available"
                        />
                      )}
                    {!usernameValidation.isChecking &&
                      usernameValidation.isAvailable === false && (
                        <X
                          className="h-4 w-4 text-red-500"
                          data-testid="icon-username-unavailable"
                        />
                      )}
                  </div>
                </div>
                {/* Error message */}
                {usernameValidation.error && (
                  <p
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    data-testid="text-username-error"
                  >
                    {usernameValidation.error}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPrivateBlockchainModal(false)}
              disabled={allocatePartyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinPrivateBlockchain}
              disabled={
                allocatePartyMutation.isPending ||
                !username.trim() ||
                usernameValidation.isChecking ||
                usernameValidation.isAvailable === false
              }
              data-testid="button-join-private-blockchain"
            >
              {allocatePartyMutation.isPending
                ? "Registering..."
                : "Join Network"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Timeout Dialog */}
      <Dialog open={showTimeoutDialog} onOpenChange={(event: boolean) => {setShowTimeoutDialog(event);window.location.reload();}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Payment Time Expired
            </DialogTitle>
            <DialogDescription>
              Your payment session has expired for security reasons. Please start a new purchase to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                For your security, you have 1 minute to complete the payment selection. 
                The page will reload automatically to start a new transaction.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowTimeoutDialog(false);
                window.location.reload();
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Reload Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Server-side MoonPay Integration - handled by webhook */}
    </div>
  );
}
