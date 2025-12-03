import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import dotenv from 'dotenv';

dotenv.config();
export default defineConfig({
  define: {
    SOLANA_GOLD_MINT: JSON.stringify(process.env.SOLANA_GOLD_MINT),
    SOLANA_SILVER_MINT: JSON.stringify(process.env.SOLANA_SILVER_MINT),
    GOLD_TOKEN_CONTRACT: JSON.stringify(process.env.GOLD_TOKEN_CONTRACT),
    SILVER_TOKEN_CONTRACT: JSON.stringify(process.env.SILVER_TOKEN_CONTRACT),
    CANTON_API_BASE_URL: JSON.stringify(process.env.CANTON_API_BASE_URL),
    ETHEREUM_RPC_URL: JSON.stringify(process.env.ETHEREUM_RPC_URL),
    EVM_GOLD_TOKEN_CONTRACT: JSON.stringify(process.env.EVM_GOLD_TOKEN_CONTRACT),
    EVM_SILVER_TOKEN_CONTRACT: JSON.stringify(process.env.EVM_SILVER_TOKEN_CONTRACT),
    WALLET_ADDRESS: JSON.stringify(process.env.WALLET_ADDRESS),
    MINT_FUNCTION_SELECTOR: JSON.stringify(process.env.MINT_FUNCTION_SELECTOR),
    SOLANA_RPC_URL: JSON.stringify(process.env.SOLANA_RPC_URL),
    GOLD_API_KEY: JSON.stringify(process.env.GOLD_API_KEY),
    GOLDAPI_BASE_URL: JSON.stringify(process.env.GOLDAPI_BASE_URL),

    ZENDESK_SUBDOMAIN: JSON.stringify(process.env.ZENDESK_SUBDOMAIN),
    ZENDESK_USERNAME: JSON.stringify(process.env.ZENDESK_USERNAME),
    ZENDESK_API_TOKEN: JSON.stringify(process.env.ZENDESK_API_TOKEN),
    
    GOLD_MG_PER_TOKEN: JSON.stringify(process.env.GOLD_MG_PER_TOKEN),
    SILVER_MG_PER_TOKEN: JSON.stringify(process.env.SILVER_MG_PER_TOKEN),
    VITE_API_BASE_URL: JSON.stringify(process.env.VITE_API_BASE_URL),
  },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,      // Use Vite's default port
    allowedHosts: true, // Allow all hosts (needed for Replit)
  },
});
