import React from "react";
import { createAppKit } from "@reown/appkit/react";
import { http, WagmiProvider } from "wagmi";
import {
  AppKitNetwork,
  mainnet,
  solanaDevnet,
  baseSepolia
} from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";

// 0. Set up Solana Adapter
const solanaWeb3JsAdapter = new SolanaAdapter();

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId from https://dashboard.reown.com
const projectId = "ce968dad1a059767f1da6498beb91645";

// 2. Create a metadata object - optional
const metadata = {
  name: "Vaulted Assets",
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

// 3. Define custom Hoodie Testnet
const hoodieTestnet: AppKitNetwork = {
  id: 560048,
  name: "Hoodie Testnet",
  network: "hoodie-testnet",
  nativeCurrency: {
    name: "Hoodie Token",
    symbol: "HOOD",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://eth-hoodi.g.alchemy.com/v2/AVi7ZUdETBLSsCTTAMMzU"], // Replace with your RPC endpoint
    },
    public: {
      http: ["https://eth-hoodi.g.alchemy.com/v2/AVi7ZUdETBLSsCTTAMMzU"], // same or public node
    },
  },
  blockExplorers: {
    default: {
      name: "Hoodie Explorer",
      url: "https://hoodi.etherscan.io/", // Replace with actual explorer if exists
    },
  },
  testnet: true,
};

// 4. Supported EVM + Solana networks
const networks = [
  mainnet,
  baseSepolia,
  hoodieTestnet,
  solanaDevnet
] as [AppKitNetwork, ...AppKitNetwork[]];

// 5. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  transports: {
    [mainnet.id]: http(),
    [baseSepolia.id]: http(),
    [hoodieTestnet.id]: http("https://eth-hoodi.g.alchemy.com/v2/AVi7ZUdETBLSsCTTAMMzU"), // update RPC
  },
});

// 6. Create modal
createAppKit({
  adapters: [wagmiAdapter, solanaWeb3JsAdapter],
  networks,
  projectId,
  metadata,
  features: {
    email: false,
    socials: ["google"],
    emailShowWallets: true,
  },
  allWallets: "SHOW",
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#CF9531",
    "--w3m-color-mix": "#CF9531",
    "--w3m-border-radius-master": "8px",
  },
});

// 7. Wrap app with providers
export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
