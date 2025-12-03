import { useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import gold_idl from "@/idl/gold_token.json";
import silver_idl from "@/idl/silver_token.json";
import type { Provider } from "@reown/appkit-adapter-solana/react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ENV } from "@shared/constants";
import {Buffer} from "buffer"
window.Buffer = Buffer;

// import { PROGRAM_ID } from '../utils/constants';

// If you don't have the constants file, use this:

const GOLD_TOKEN_PROGRAM_ID = new PublicKey(SOLANA_GOLD_MINT);
const SILVER_TOKEN_PROGRAM_ID = new PublicKey(SOLANA_SILVER_MINT);

export function useSolanaTokenRedemption(tokenType: "GOLD" | "SILVER") {
  // Use Reown Kit hooks instead of Solana wallet adapter
  const { toast } = useToast();
  const { t } = useTranslation();

  const PROGRAM_ID =
    tokenType === "GOLD" ? GOLD_TOKEN_PROGRAM_ID : SILVER_TOKEN_PROGRAM_ID;

  console.log(tokenType, "PROGRAM_ID", PROGRAM_ID.toString());
  const { address, isConnected } = useAppKitAccount();

  const solanaProvider = useAppKitProvider<Provider>("solana");
  const walletProvider = solanaProvider?.walletProvider;

  const chainId = "solana_devnet";
  // Create connection (you might want to adjust the RPC endpoint based on your network)

  const connection = useMemo(() => {
    // Use appropriate RPC endpoint based on your network
    const rpcEndpoint = chainId?.includes("devnet")
      ? "https://api.devnet.solana.com"
      : "https://api.mainnet-beta.solana.com";
    return new Connection(rpcEndpoint, "confirmed");
  }, [chainId]);

  // Convert address string to PublicKey
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

    // Create a wallet-like interface for AnchorProvider
    const walletInterface = {
      publicKey,
      signTransaction: async (transaction: any) => {
        if (!(walletProvider as any).signTransaction) {
          throw new Error("Wallet does not support transaction signing");
        }
        return await (walletProvider as any).signTransaction(transaction);
      },
      signAllTransactions: async (transactions: any[]) => {
        if (!(walletProvider as any).signAllTransactions) {
          throw new Error("Wallet does not support batch transaction signing");
        }
        return await (walletProvider as any).signAllTransactions(transactions);
      },
    };

    return new AnchorProvider(connection, walletInterface as any, {
      commitment: "confirmed",
    });
  }, [connection, publicKey, walletProvider, isConnected]);

  const program = useMemo(() => {
    if (!provider) return null;
    console.log("program");
    if (tokenType === "GOLD") return new Program(gold_idl as Idl, provider);
    else return new Program(silver_idl as Idl, provider);
  }, [provider]);

  const getConfig = async () => {
    if (!program || !connection) return null;
    console.log("config");

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      PROGRAM_ID,
    );

    console.log("configPda", PROGRAM_ID.toString());
    try {
      console.log("Fetching config from PDA:", configPda.toString());
      const config = await (program.account as any).config.fetch(configPda);
      console.log("Fetched config:", config);
      return {
        admin: config.admin.toString(),
        mint: config.mint.toString(),
        gatekeeper_program: config.gatekeeperProgram.toString(),
        redemption_request_counter: config.redemptionRequestCounter.toNumber(),
        is_paused: config.isPaused,
        configPda: configPda.toString(),
      };
    } catch (error) {
      console.error("Error fetching config:", error);
      return null;
    }
  };

  const requestRedemption = async (
    amount: number,
    logSuccessfulRedemption: any,
    setIsSolanaRedemption: any,
  ) => {
    if (!program || !publicKey) {
      throw new Error("Wallet not connected or program not initialized");
    }

    if (!chainId?.includes("solana")) {
      throw new Error("Please switch to a Solana network");
    }

    setIsSolanaRedemption(true);
    try {
      // Get config first to get the current counter
      const config = await getConfig();
      if (!config) {
        throw new Error("Could not fetch program config");
      }

      const mint = new PublicKey(config.mint);
      // const userTokenAccountPubkey = new PublicKey(userTokenAccount);
      const userTokenAccountPubkey = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false, // allowOwnerOffCurve
        TOKEN_2022_PROGRAM_ID,
        // ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      const configPda = new PublicKey(config.configPda);

      // Calculate the next request ID (this will be incremented in the program)
      const nextRequestId = config.redemption_request_counter + 1;
      console.log("nextRequestId", nextRequestId,PROGRAM_ID.toString());
      // Get PDAs - Fixed seed generation based on IDL
      const [redemptionRequestPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("redemption_request"), // This matches the const value in IDL
          publicKey.toBuffer(), // user account
          // The counter seed should be the incremented value as u64 in little-endian
          Buffer.from(new BN(nextRequestId).toArrayLike(Buffer, "le", 8)),
        ],
        PROGRAM_ID,
      );

      const [redemptionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("redemption_pda"), // This matches the const value in IDL
          publicKey.toBuffer(), // user account
          // The counter seed should be the incremented value as u64 in little-endian
          Buffer.from(new BN(nextRequestId).toArrayLike(Buffer, "le", 8)),
        ],
        PROGRAM_ID,
      );

      console.log("Requesting redemption with params:", {
        user: publicKey.toString(),
        amount,
        nextRequestId,
        config: configPda.toString(),
        redemption_request: redemptionRequestPda.toString(),
        user_token_account: userTokenAccountPubkey.toString(),
        mint: mint.toString(),
        redemption_pda: redemptionPda.toString(),
      });

      // Use TOKEN_2022_PROGRAM_ID instead of TOKEN_PROGRAM_ID to match your mint setup
      const tx = await program.methods
        .requestRedemption(new BN(amount))
        .accounts({
          user: publicKey,
          config: configPda,
          redemptionRequest: redemptionRequestPda, // Note: camelCase in Anchor
          userTokenAccount: userTokenAccountPubkey, // Note: camelCase in Anchor
          mint: mint,
          redemptionPda: redemptionPda, // Note: camelCase in Anchor
          tokenProgram: TOKEN_2022_PROGRAM_ID, // Use TOKEN_2022_PROGRAM_ID to match your setup
          systemProgram: SystemProgram.programId, // Note: camelCase in Anchor
        })
        .rpc();

      console.log("Redemption request successful:", tx);
      logSuccessfulRedemption(tx);
      return {
        signature: tx,
        redemption_request: redemptionRequestPda.toString(),
        redemption_pda: redemptionPda.toString(),
        request_id: nextRequestId,
        amount,
      };
    } catch (error: any) {
      console.error("Error requesting redemption:", error);

      // Handle specific error types with user-friendly messages
      let errorMessage = t("redemption.solanaRedemptionFailedDescription");

      if (error?.code === 4001 || error?.message?.includes("User rejected")) {
        errorMessage = t("redemption.transactionRejected");
      } else if (error?.message?.includes("Wallet not connected")) {
        errorMessage = t("redemption.walletNotConnectedDescription");
      } else if (error?.message?.includes("switch to a Solana network")) {
        errorMessage = t("redemption.switchToSolanaNetwork");
      }

      toast({
        title: t("redemption.redemptionFailedTitle"),
        description: errorMessage,
        variant: "destructive",
      });

      // Return null instead of throwing to prevent unhandled rejection
      return null;
    } finally {
      setIsSolanaRedemption(false);
    }
  };
 

  const cancelRedemption = async (requestId: number, setIsCancelling: any) => {
    if (!program || !publicKey) {
      throw new Error("Wallet not connected or program not initialized");
    }

    if (!chainId?.includes("solana")) {
      throw new Error("Please switch to a Solana network");
    }

    setIsCancelling(true);
    try {
      // Derive the redemption request PDA using same seeds as requestRedemption
      const config = await getConfig();
      if (!config) {
        throw new Error("Could not fetch program config");
      }

      const mint = new PublicKey(config.mint);
      const [redemptionRequestPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("redemption_request"),
          publicKey.toBuffer(),
          Buffer.from(new BN(requestId).toArrayLike(Buffer, "le", 8)),
        ],
        PROGRAM_ID,
      );

      const userTokenAccountPubkey = await getAssociatedTokenAddress(
        mint,
        publicKey,
        false, // allowOwnerOffCurve
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      const [configAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        PROGRAM_ID,
      );

      console.log("Cancelling redemption with params:", {
        user: publicKey.toString(),
        requestId,
        redemption_request: redemptionRequestPda.toString(),
        user_token_account: userTokenAccountPubkey.toString(),
      });

      const tx = await program.methods
        .cancelRedemption()
        .accounts({
          user: publicKey,
          config: configAccount,
          redemptionRequest: redemptionRequestPda,
          userTokenAccount: userTokenAccountPubkey,
          //@ts-ignore
          supplyControllerRole: null,
          tokenProgram: TOKEN_2022_PROGRAM_ID, // same as in requestRedemption
        })
        .rpc();

      console.log("Redemption cancel successful:", tx);
      return {
        signature: tx,
        redemption_request: redemptionRequestPda.toString(),
        request_id: requestId,
      };
    } catch (error) {
      console.error("Error cancelling redemption:", error);
      throw error;
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    program,
    getConfig,
    requestRedemption,
    cancelRedemption,
    connected: isConnected && chainId.includes("solana"),
    publicKey,
    address, // Raw address string from Reown Kit
    chainId,
  };
}
