import { useMemo, useCallback, useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import gold_idl from "@/idl/gold_token.json";
import silver_idl from "@/idl/silver_token.json";
import { ENV } from "@shared/constants";

const GOLD_TOKEN_PROGRAM_ID = new PublicKey(
  SOLANA_GOLD_MINT || "4Abztzso97KPMy6fdexqNeVKqUUn2KF5aw6Vb99rV8qg",
);
const SILVER_TOKEN_PROGRAM_ID = new PublicKey(
  SOLANA_SILVER_MINT || "3teuujqputEYdvTTLK6eoYygKF2EWDdgFVFGQoce3mc3",
);

export function useSolanaTokenBalance() {
  const { address, isConnected } = useAppKitAccount();
  const solanaProvider = useAppKitProvider<any>("solana");
  const walletProvider = solanaProvider?.walletProvider;
  const chainId = "solana_devnet";

  const connection = useMemo(() => {
    const rpcEndpoint = chainId.includes("devnet")
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com";
    return new Connection(rpcEndpoint, "confirmed");
  }, [chainId]);

  const publicKey = useMemo(() => {
    if (!address) return null;
    try {
      return new PublicKey(address);
    } catch (error) {
      console.error("Invalid public key:", error);
      return null;
    }
  }, [address]);

  const provider = useMemo(() => {
    if (!publicKey || !walletProvider || !isConnected) return null;

    const walletInterface = {
      publicKey,
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
  }, [connection, publicKey, walletProvider, isConnected]);

  const goldProgram = useMemo(() => {
    if (!provider) return null;
    return new Program(gold_idl as any, provider);
  }, [provider]);

  const silverProgram = useMemo(() => {
    if (!provider) return null;
    return new Program(silver_idl as any, provider);
  }, [provider]);

  // Get token mint address from program config
  const getTokenMint = useCallback(
    async (program: Program | null, programId: PublicKey) => {
      if (!program || !connection) return null;
      try {
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("config")],
          programId,
        );
        const config = await (program.account as any).config.fetch(configPda);
        return config.mint as PublicKey;
      } catch (error) {
        console.error("Error fetching config:", error);
        return null;
      }
    },
    [connection],
  );

  // Get token balance for a specific mint
  const getTokenBalance = useCallback(
    async (mintAddress: PublicKey) => {
      if (!publicKey || !connection) return 0;
      try {
        const ata = await getAssociatedTokenAddress(
          mintAddress,
          publicKey,
          false, // allowOwnerOffCurve
          TOKEN_2022_PROGRAM_ID,
        );

        // Check if the account exists first
        const accountInfo = await connection.getAccountInfo(ata);
        if (!accountInfo) {
          console.log(
            `Token account does not exist for mint: ${mintAddress.toString()}`,
          );
          return 0;
        }

        const tokenAccount =
          await provider?.connection.getTokenAccountBalance(ata);

        console.log(tokenAccount);
        // Get mint info to determine decimals

        return tokenAccount?.value.uiAmount;
      } catch (error) {
        console.log(
          `Error fetching balance for mint ${mintAddress.toString()}:`,
          error,
        );
        return 0;
      }
    },
    [connection, publicKey],
  );

  const [balances, setBalances] = useState<{ gold: number; silver: number }>({
    gold: 0,
    silver: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!goldProgram || !silverProgram || !publicKey) {
        setBalances({ gold: 0, silver: 0 });
        return;
      }

      setLoading(true);
      try {
        // Get mint addresses from program configs
        const goldMint = await getTokenMint(goldProgram, GOLD_TOKEN_PROGRAM_ID);
        const silverMint = await getTokenMint(
          silverProgram,
          SILVER_TOKEN_PROGRAM_ID,
        );

        // Fetch balances for both tokens
        const [goldBalance, silverBalance] = await Promise.all([
          goldMint ? getTokenBalance(goldMint) : Promise.resolve(0),
          silverMint ? getTokenBalance(silverMint) : Promise.resolve(0),
        ]);

        setBalances({ gold: goldBalance, silver: silverBalance });
        console.log("Token Balances:", {
          gold: goldBalance,
          silver: silverBalance,
        });
      } catch (err) {
        console.error("Error fetching balances:", err);
        setBalances({ gold: 0, silver: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [goldProgram, silverProgram, publicKey, getTokenMint, getTokenBalance]);

  return { ...balances, loading };
}
