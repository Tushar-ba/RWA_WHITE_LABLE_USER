import React from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import {
  polygon,
  holesky,
  solanaDevnet,
} from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from environment (Reown dashboard)
const projectId = "ebe9c55f5555613ca9fef084169c9e21";

// 2. Define Hoodi Testnet as a custom chain using viem
const hoodiChainId = Number(
  import.meta.env.VITE_HOODI_CHAIN_ID || "560048",
);
const hoodiRpcUrl =
  import.meta.env.VITE_ETHEREUM_RPC_URL || "https://eth-hoodi.g.alchemy.com/v2/AVi7ZUdETBLSsCTTAMMzU";

const hoodiChain = defineChain({
  id: hoodiChainId,
  name: "Hoodi Testnet",
  network: "hoodi-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [hoodiRpcUrl],
    },
    public: {
      http: [hoodiRpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: "Hoodi Explorer",
      url:
        import.meta.env.VITE_HOODI_EXPLORER_URL ||
        "https://explorer.hoodi.io",
    },
  },
  testnet: true,
});

// Convert to AppKitNetwork format
const hoodiTestnet: AppKitNetwork = hoodiChain as AppKitNetwork;

// 3. Set up networks - Hoodi first, then others
const networks = [
  hoodiTestnet,
  polygon,
  holesky,
  solanaDevnet,
] as [AppKitNetwork, ...AppKitNetwork[]];

// 4. Setup Wagmi adapter for EVM chains
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

// 5. Setup Solana adapter
const solanaWeb3JsAdapter = new SolanaAdapter();

// 6. Configure metadata
const metadata = {
  name: "Solulab Assets",
  description: "Digital Asset Vaulting Platform",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://vaulted-assets.replit.app",
  icons: [
    typeof window !== "undefined"
      ? `${window.location.origin}/favicon.ico`
      : "https://vaulted-assets.replit.app/favicon.ico",
  ],
};

// 7. Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#B8860B",
    "--w3m-color-mix": "#B8860B",
    "--w3m-border-radius-master": "8px",
  },
});

// 8. Wrap app with providers
export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
