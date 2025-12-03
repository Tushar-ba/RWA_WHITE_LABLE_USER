type Env = {
  // Application
  NODE_ENV: "development" | "production" | "test";
  PORT: string | number;
  FRONTEND_URL: string;

  // Database
  MONGODB_URI: string;

  // Authentication & Security
  JWT_SECRET: string;
  SESSION_SECRET: string;
  PRIVATE_KEY: string;

  // Blockchain - Ethereum
  ETHEREUM_RPC_URL: string;
  EVM_GOLD_TOKEN_CONTRACT: string;
  EVM_SILVER_TOKEN_CONTRACT: string;
  WALLET_ADDRESS: string;
  MINT_FUNCTION_SELECTOR: string;

  // Blockchain - Solana
  SOLANA_RPC_URL: string;
  GOLD_TOKEN_CONTRACT: string;
  SILVER_TOKEN_CONTRACT: string;
  SOLANA_GOLD_MINT: string;
  SOLANA_SILVER_MINT: string;

  // External APIs
  GOLD_API_KEY: string;
  GOLDAPI_BASE_URL: string;
 
  ZENDESK_SUBDOMAIN: string;
  ZENDESK_USERNAME: string;
  ZENDESK_API_TOKEN: string;

  // Email Configuration
  SENDGRID_FROM_EMAIL: string;
  SENDGRID_API_KEY: string;

  // Canton API
  CANTON_API_BASE_URL: string;

  // Token Conversion Values
  GOLD_MG_PER_TOKEN: string;
  SILVER_MG_PER_TOKEN: string;

  // Frontend Base URL
  VITE_API_BASE_URL: string;
};

export const ENV: Env = {
  // Application
  NODE_ENV:
    (process.env.NODE_ENV as "development" | "production" | "test") ||
    "development",
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || "",
  // Database
  MONGODB_URI: process.env.MONGODB_URI || "",

  // Authentication & Security
  JWT_SECRET: process.env.JWT_SECRET || "",
  SESSION_SECRET: process.env.SESSION_SECRET || "",
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",

  // Blockchain - Ethereum
  ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL || "",
  GOLD_TOKEN_CONTRACT:
    process.env.GOLD_TOKEN_CONTRACT || "",
  SILVER_TOKEN_CONTRACT:
    process.env.SILVER_TOKEN_CONTRACT || "",
  EVM_GOLD_TOKEN_CONTRACT:
    process.env.EVM_GOLD_TOKEN_CONTRACT || "",
  EVM_SILVER_TOKEN_CONTRACT:
    process.env.EVM_SILVER_TOKEN_CONTRACT || "",  
  WALLET_ADDRESS: process.env.WALLET_ADDRESS || "",
  MINT_FUNCTION_SELECTOR: process.env.MINT_FUNCTION_SELECTOR || "",

  // Blockchain - Solana
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || "",
  SOLANA_GOLD_MINT:
    process.env.SOLANA_GOLD_MINT || "",
  SOLANA_SILVER_MINT:
    process.env.SOLANA_SILVER_MINT || "",

  // External APIs
  GOLD_API_KEY: process.env.GOLD_API_KEY || "",
  GOLDAPI_BASE_URL: process.env.GOLDAPI_BASE_URL || "",

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "",


  ZENDESK_SUBDOMAIN:
    process.env.ZENDESK_SUBDOMAIN || "",
  ZENDESK_USERNAME: process.env.ZENDESK_USERNAME || "",
  ZENDESK_API_TOKEN:
    process.env.ZENDESK_API_TOKEN || "",

  // Email Configuration
  SENDGRID_FROM_EMAIL:
    process.env.SENDGRID_FROM_EMAIL || "",

  // Canton API
  CANTON_API_BASE_URL:
    process.env.CANTON_API_BASE_URL || "",

  // Token Conversion Values
  GOLD_MG_PER_TOKEN: process.env.GOLD_MG_PER_TOKEN || "10",
  SILVER_MG_PER_TOKEN: process.env.SILVER_MG_PER_TOKEN || "10",

  // Frontend Base URL
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || "",
};
