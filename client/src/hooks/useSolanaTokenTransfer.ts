import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedWithTransferHookInstruction,
} from "@solana/spl-token";
import { useAppKitProvider } from "@reown/appkit/react";
import {
  useAppKitConnection,
  type Provider,
} from "@reown/appkit-adapter-solana/react";
import { useState, useCallback, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { ENV } from "@shared/constants";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import gold_idl from "@/idl/gold_token.json";
import silver_idl from "@/idl/silver_token.json";

export type SolanaTokenType = "GOLD" | "SILVER";

// Program IDs for token programs
const GOLD_TOKEN_PROGRAM_ID = new PublicKey(
  SOLANA_GOLD_MINT || "4Abztzso97KPMy6fdexqNeVKqUUn2KF5aw6Vb99rV8qg",
);
const SILVER_TOKEN_PROGRAM_ID = new PublicKey(
  SOLANA_SILVER_MINT || "3teuujqputEYdvTTLK6eoYygKF2EWDdgFVFGQoce3mc3",
);

interface SolanaTokenConfig {
  programId: PublicKey;
  idl: any;
  name: string;
  symbol: string;
  decimals: number;
}

// Solana token configurations
const SOLANA_TOKEN_CONFIGS: Record<SolanaTokenType, SolanaTokenConfig> = {
  GOLD: {
    programId: GOLD_TOKEN_PROGRAM_ID,
    idl: gold_idl,
    name: "Gold Reserve Token",
    symbol: "GRT",
    decimals: 9,
  },
  SILVER: {
    programId: SILVER_TOKEN_PROGRAM_ID,
    idl: silver_idl,
    name: "Silver Reserve Token",
    symbol: "SRT",
    decimals: 9,
  },
};

console.log("solana config", SOLANA_TOKEN_CONFIGS);

export function useSolanaTokenTransfer(tokenType: SolanaTokenType) {
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Create provider for Anchor
  const provider = useMemo(() => {
    if (!walletProvider?.publicKey || !connection) return null;

    const walletInterface = {
      publicKey: walletProvider.publicKey,
      signTransaction: async (transaction: any) => {
        if (!(walletProvider as any).signTransaction) {
          console.log("Wallet does not support transaction signing");
        }
        return await (walletProvider as any).signTransaction(transaction);
      },
      signAllTransactions: async (transactions: any[]) => {
        if (!(walletProvider as any).signAllTransactions) {
          console.log("Wallet does not support batch transaction signing");
        }
        return await (walletProvider as any).signAllTransactions(transactions);
      },
    };

    return new AnchorProvider(connection, walletInterface as any, {
      commitment: "confirmed",
    });
  }, [connection, walletProvider]);

  // Create program instance
  const program = useMemo(() => {
    if (!provider) return null;
    const tokenConfig = SOLANA_TOKEN_CONFIGS[tokenType];
    console.log("tokenConfig", tokenConfig);
    return new Program(tokenConfig?.idl as any, provider);
  }, [provider, tokenType]);

  // Get token mint address from program config
  const getTokenMint = useCallback(
    async (programId: PublicKey) => {
      if (!program || !connection) return null;
      try {
        setStatus("Fetching token mint address…");
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          programId,
        );
        const config = await (program.account as any).config.fetch(configPda);
        return config.mint as PublicKey;
      } catch (error) {
        console.error("Error fetching token mint from config:", error);
        throw new Error(
          `Failed to fetch ${tokenType} token mint address from program config`,
        );
      }
    },
    [program, connection, tokenType],
  );

  const transfer = useCallback(
    async ({ to, amount }: { to: string; amount: number }) => {
      try {
        setIsLoading(true);
        setError(null);
        setTransactionHash(null);
        setStatus("Preparing transfer…");

        if (!connection) {
          throw new Error("Solana connection not available");
        }

        if (!walletProvider?.publicKey) {
          throw new Error("Wallet not connected");
        }

        if (!program) {
          throw new Error("Program not initialized");
        }

        const tokenConfig = SOLANA_TOKEN_CONFIGS[tokenType];

        if (!to) {
          throw new Error("Recipient address is required");
        }

        if (amount <= 0) {
          throw new Error("Amount must be greater than 0");
        }

        const fromPk = walletProvider.publicKey;
        const toPk = new PublicKey(to);

        // Dynamically fetch the mint address from program config
        const mintPk = await getTokenMint(tokenConfig.programId);
        if (!mintPk) {
          throw new Error(`Failed to get ${tokenType} mint address`);
        }

        console.log("Using mint address:", mintPk.toBase58());
        console.log("Using token program:", tokenConfig.programId.toBase58());

        setStatus("Deriving token accounts…");

        // Derive ATA (associated token accounts)
        const fromTokenAccount = getAssociatedTokenAddressSync(
          mintPk,
          fromPk,
          false,
          TOKEN_2022_PROGRAM_ID, // Use TOKEN_2022_PROGRAM_ID for token accounts
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        const toTokenAccount = getAssociatedTokenAddressSync(
          mintPk,
          toPk,
          false,
          TOKEN_2022_PROGRAM_ID, // Use TOKEN_2022_PROGRAM_ID for token accounts
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        // Check if source account exists and has sufficient balance
        setStatus("Checking account balances…");
        const fromAccountInfo =
          await connection.getAccountInfo(fromTokenAccount);
        if (!fromAccountInfo) {
          throw new Error(
            `Source token account does not exist. Please ensure you have ${tokenType} tokens in your wallet.`,
          );
        }

        // Create destination ATA if needed
        const toAccountInfo = await connection.getAccountInfo(toTokenAccount);
        const instructions = [];

        if (!toAccountInfo) {
          setStatus("Creating recipient token account…");
          instructions.push(
            createAssociatedTokenAccountInstruction(
              fromPk,
              toTokenAccount,
              toPk,
              mintPk,
              TOKEN_2022_PROGRAM_ID, // Use TOKEN_2022_PROGRAM_ID for token accounts
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }

        // Amount → raw units (using token's decimal places)
        const rawAmount = BigInt(amount * 10 ** tokenConfig.decimals);

        setStatus("Creating transfer instruction…");

        // Create transfer instruction with transfer hook
        const transferIx =
          await createTransferCheckedWithTransferHookInstruction(
            connection,
            fromTokenAccount,
            mintPk,
            toTokenAccount,
            fromPk,
            rawAmount,
            tokenConfig.decimals,
            [],
            "confirmed",
            TOKEN_2022_PROGRAM_ID, // Use TOKEN_2022_PROGRAM_ID for transfers
          );

        instructions.push(transferIx);

        const tx = new Transaction().add(...instructions);
        tx.feePayer = fromPk;
        tx.recentBlockhash = (
          await connection.getLatestBlockhash("confirmed")
        ).blockhash;

        setStatus("Sending transaction…");

        const sig = await walletProvider.signAndSendTransaction(tx);
        setTransactionHash(sig);

        setStatus("Confirming transaction…");
        await connection.confirmTransaction(sig, "confirmed");

        setStatus(`✅ Transfer successful! Tx: ${sig}`);

        toast({
          title: `${tokenType} Transfer Successful`,
          description: `Transferred ${amount} ${tokenConfig.symbol} tokens to ${to.slice(0, 8)}...${to.slice(-6)}`,
          duration: 5000,
        });

        return sig;
      } catch (err: any) {
        console.error("❌ Solana transfer failed:", err);
        setError(err);
        setStatus("❌ Transfer failed");

        toast({
          title: `${tokenType} Transfer Failed`,
          description:
            err.message || `Failed to transfer ${tokenType} tokens on Solana`,
          variant: "destructive",
        });

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [connection, walletProvider, tokenType, program, getTokenMint],
  );

  const reset = useCallback(() => {
    setStatus(null);
    setError(null);
    setTransactionHash(null);
    setIsLoading(false);
  }, []);

  return {
    transfer,
    status,
    isLoading,
    transactionHash,
    error,
    reset,
    // Additional properties for compatibility with existing useTokenTransfer hook
    isPending: isLoading,
    isConfirming: false,
    isConfirmed: !!transactionHash && !error,
  };
}
