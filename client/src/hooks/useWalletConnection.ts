import { useEffect, useState, useRef } from "react";
import {
  useAppKitAccount,
  useDisconnect,
  useAppKitProvider,
} from "@reown/appkit/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWallet } from "@/api/mutations";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useWalletConnection = () => {
  const [connectorError, setConnectorError] = useState<string | null>(null);
  // Track processed wallet addresses to prevent duplicate API calls
  const processedWalletsRef = useRef<Set<string>>(new Set());

  // Get wallet account info with error handling
  let address, isConnected;
  try {
    const accountInfo = useAppKitAccount();
    address = accountInfo.address;
    isConnected = accountInfo.isConnected;

    // Clear any previous connector errors if successful
    if (connectorError) {
      setConnectorError(null);
    }
  } catch (error) {
    // Handle WagmiAdapter connector undefined error gracefully
    const errorMessage =
      error instanceof Error ? error.message : "Unknown wallet error";

    if (errorMessage.includes("connector is undefined")) {
      // Only log once to avoid spam
      if (!connectorError) {
        console.warn(
          "WagmiAdapter connector not ready yet, wallet features temporarily unavailable",
        );
        setConnectorError(errorMessage);
      }
    }

    // Provide safe defaults when connector is undefined
    address = undefined;
    isConnected = false;
  }

  // Get disconnect function with error handling
  let disconnect;
  try {
    const disconnectInfo = useDisconnect();
    disconnect = disconnectInfo.disconnect;
  } catch (error) {
    console.warn("Wallet disconnect not available yet");
    disconnect = () => {};
  }
  const { token, wallets } = useAuthStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { caipAddress } = useAppKitAccount(); // for EVM chains

  // Use state to track provider type and prevent duplicate API calls
  const [providerType, setProviderType] = useState<string>("public");

  useEffect(() => {
    if (caipAddress?.includes("eip155")) {
      setProviderType("public");
    } else if (caipAddress?.includes("solana")) {
      setProviderType("solana");
    }
  }, [caipAddress]);

  // Mutation to add wallet to user profile
  const addWalletMutation = useMutation({
    mutationFn: (payload: {
      provider: string;
      address: string;
      label?: string;
    }) => addWallet(payload, token || undefined),
    onSuccess: (response) => {
      console.log("addWallet success response:", response);

      // Invalidate user profile query to refresh wallet data
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });

      toast({
        title: t("toasts.walletConnected"),
        description: `Wallet ${response.wallet?.address} has been added to your profile.`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.log("addWallet error:", error);
      disconnect();
      const errorMessage =
        error.message || "Failed to add wallet to your profile.";

      // Don't disconnect wallet on API errors - let user handle it manually
      // Disconnecting automatically can cause poor UX when the issue is just a temporary API error

      // Show error toast for all errors except auth errors (which will trigger redirect)
      if (!errorMessage.includes("Invalid or expired token")) {
        toast({
          title: t("toasts.walletConnectionError"),
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    },
  });

  // Monitor wallet connection changes
  useEffect(() => {
    // Skip if there's a connector error
    if (connectorError) {
      return;
    }

    // Only proceed if user is authenticated and wallet is connected
    if (!isConnected || !address || !token) {
      // Clear processed wallets when disconnected
      processedWalletsRef.current.clear();
      return;
    }

    // Don't add wallet if mutation is already in progress
    if (addWalletMutation.isPending) {
      return;
    }

    // Check if we've already processed this exact wallet address
    if (processedWalletsRef.current.has(address)) {
      console.log("Wallet already processed, skipping:", address);
      return;
    }

    // Check if the connected address already exists in the wallet array
    // For Ethereum: case-insensitive comparison (addresses start with 0x)
    // For Solana: case-sensitive comparison (Base58 encoded)
    const normalizeAddress = (addr: string): string => {
      const trimmed = addr.trim();
      return trimmed.startsWith('0x') ? trimmed.toLowerCase() : trimmed;
    };

    const normalizedAddress = normalizeAddress(address);
    const addressExists = wallets.some(
      (wallet) => wallet.address && normalizeAddress(wallet.address) === normalizedAddress,
    );
    console.log("Connected wallet address:", wallets);
    console.log("Connected wallet address exists:", addressExists);

    // If address already exists, don't call the add wallet API
    if (addressExists) {
      console.log("Wallet address already exists in user profile:", address);
      processedWalletsRef.current.add(address); // Mark as processed
      return;
    }

    // Mark wallet as being processed to prevent duplicate calls
    processedWalletsRef.current.add(address);

    // Automatically add wallet when connected
    const walletPayload = {
      provider: providerType, // Use current provider type
      address: address,
      label: wallets.length === 0 ? "primary" : "secondary", // First wallet is primary, others are secondary
    };

    console.log("Adding wallet to profile:", walletPayload);
    addWalletMutation.mutate(walletPayload);
  }, [
    isConnected,
    connectorError,
    address,
    token,
    wallets.length,
    addWalletMutation.isPending,
    providerType, // Include provider type to handle changes
  ]); // Include all dependencies

  return {
    isAddingWallet: addWalletMutation.isPending,
    addWalletError: addWalletMutation.error,
  };
};
