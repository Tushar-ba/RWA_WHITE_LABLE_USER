import {
  Connection,
  PublicKey,
  clusterApiUrl,
  ConfirmedSignatureInfo,
} from "@solana/web3.js";
import {
  Program,
  AnchorProvider,
  Wallet,
  Idl,
  EventParser,
  BorshCoder,
} from "@coral-xyz/anchor";
import BN from "bn.js";
import { storage } from "../storage/index.js";
import { BlockchainEmailService } from "./blockchain-email.service.js";
import { Logger } from "../utils/logger.js";
// Import actual IDL structure from file system
import { readFileSync } from "fs";
const goldTokenIdl = JSON.parse(
  readFileSync("./server/services/gold_token_idl.json", "utf8"),
);

// Define the Solana token program interface
type SolanaTokenProgram = Idl;

// Event interfaces based on your IDL structure (matching the actual IDL)
interface RedemptionRequestedEvent {
  user: PublicKey;
  request_id: InstanceType<typeof BN>; // Using underscore format as per IDL
  amount: InstanceType<typeof BN>;
  timestamp: InstanceType<typeof BN>;
}

interface RedemptionCancelledEvent {
  user: PublicKey;
  request_id: InstanceType<typeof BN>;
  amount: InstanceType<typeof BN>;
  timestamp: InstanceType<typeof BN>;
}

// Note: RedemptionFulfilled is not in your IDL, so we'll handle it separately if needed
interface RedemptionFulfilledEvent {
  user: PublicKey;
  request_id: InstanceType<typeof BN>;
  amount: InstanceType<typeof BN>;
  timestamp: InstanceType<typeof BN>;
}

// Additional event interfaces for the new instructions
interface MintEvent {
  user: PublicKey;
  request_id?: InstanceType<typeof BN>;
  amount: InstanceType<typeof BN>;
  timestamp?: InstanceType<typeof BN>;
}

interface FulfillRedemptionEvent {
  user: PublicKey;
  request_id: InstanceType<typeof BN>;
  amount: InstanceType<typeof BN>;
  timestamp?: InstanceType<typeof BN>;
}

interface MintTokensEvent {
  user: PublicKey;
  request_id?: InstanceType<typeof BN>;
  amount: InstanceType<typeof BN>;
  timestamp?: InstanceType<typeof BN>;
}

interface SetRedemptionProcessingEvent {
  user: PublicKey;
  request_id: InstanceType<typeof BN>;
  status: string;
  timestamp?: InstanceType<typeof BN>;
}

interface ProcessedTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  processed: boolean;
}

export class SolanaBlockchainListener {
  private connection: Connection;
  private goldProgram: Program<SolanaTokenProgram> | null = null;
  private silverProgram: Program<SolanaTokenProgram> | null = null;
  private isListening: boolean = false;
  private goldTokenMint: PublicKey;
  private silverTokenMint: PublicKey;
  private goldProgramId: PublicKey;
  private silverProgramId: PublicKey;
  private lastProcessedSlot: number = 0;
  private lastProcessedSignature: string = "";
  private eventListenerIds: number[] = [];
  private accountSubscriptionIds: number[] = [];
  private processedTransactions: Set<string> = new Set();
  private isProcessingHistory: boolean = false;
  private splTokenProgramId: PublicKey;

  /**
   * Clear processed transactions cache (for debugging)
   */
  clearProcessedTransactions(): void {
    this.processedTransactions.clear();
    console.log(
      "[SOLANA] 🔍 Cleared processed transactions cache for debugging",
    );
  }
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // 5 seconds

  constructor() {
    // Initialize Solana connection with better configuration
    const rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
    this.connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      wsEndpoint: rpcUrl
        .replace("https://", "wss://")
        .replace("http://", "ws://"),
      confirmTransactionInitialTimeout: 60000,
    });

    // Initialize program IDs for both Gold and Silver tokens from environment variables
    this.goldProgramId = new PublicKey(
      process.env.SOLANA_GOLD_MINT ||
        "4Abztzso97KPMy6fdexqNeVKqUUn2KF5aw6Vb99rV8qg",
    );
    this.silverProgramId = new PublicKey(
      process.env.SOLANA_SILVER_MINT ||
        "3teuujqputEYdvTTLK6eoYygKF2EWDdgFVFGQoce3mc3",
    );

    // Initialize mint addresses (these should be the actual token mint addresses)
    this.goldTokenMint = new PublicKey(
      process.env.SOLANA_GOLD_TOKEN_MINT || this.goldProgramId.toString(),
    );
    this.silverTokenMint = new PublicKey(
      process.env.SOLANA_SILVER_TOKEN_MINT || this.silverProgramId.toString(),
    );

    // Initialize SPL Token Program ID for transfer monitoring
    this.splTokenProgramId = new PublicKey(
      "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    );

    console.log("[SOLANA] Solana blockchain listener initialized");
    console.log("[SOLANA] Gold Program ID:", this.goldProgramId.toString());
    console.log("[SOLANA] Silver Program ID:", this.silverProgramId.toString());
    console.log("[SOLANA] Gold Token Mint:", this.goldTokenMint.toString());
    console.log("[SOLANA] Silver Token Mint:", this.silverTokenMint.toString());

    // Load last processed state from storage if available
    this.loadLastProcessedState();
  }

  /**
   * Load last processed state from persistent storage
   */
  private async loadLastProcessedState(): Promise<void> {
    try {
      // This should be implemented in your storage layer
      // const state = await storage.getListenerState('solana');
      // if (state) {
      //   this.lastProcessedSlot = state.lastProcessedSlot || 0;
      //   this.lastProcessedSignature = state.lastProcessedSignature || '';
      // }
    } catch (error) {
      console.error("[SOLANA] Failed to load last processed state:", error);
    }
  }

  /**
   * Save current processed state to persistent storage
   */
  private async saveLastProcessedState(): Promise<void> {
    try {
      // This should be implemented in your storage layer
      // await storage.saveListenerState('solana', {
      //   lastProcessedSlot: this.lastProcessedSlot,
      //   lastProcessedSignature: this.lastProcessedSignature,
      //   updatedAt: new Date()
      // });
    } catch (error) {
      console.error("[SOLANA] Failed to save last processed state:", error);
    }
  }

  /**
   * Initialize manual parsing for both Gold and Silver programs
   * Skip Anchor Program initialization due to IDL issues, use manual parsing only
   */
  async initializePrograms(): Promise<void> {
    try {
      // Skip Anchor program initialization for now due to IDL size issues
      // We'll rely on manual parsing of program data from transaction logs
      console.log(
        "[SOLANA] Using manual parsing mode for both Gold and Silver programs",
      );
      console.log("[SOLANA] Gold Program ID:", this.goldProgramId.toString());
      console.log(
        "[SOLANA] Silver Program ID:",
        this.silverProgramId.toString(),
      );

      // Set programs to null to indicate manual parsing mode
      this.goldProgram = null;
      this.silverProgram = null;

      console.log(
        "[SOLANA] Manual parsing initialization completed successfully",
      );
    } catch (error) {
      console.error("[SOLANA] Failed to initialize programs:", error);
      throw error;
    }
  }

  /**
   * Process historic events to ensure no events are missed
   * Similar to Ethereum blockchain-listener.ts processHistoricEvents
   */
  async processHistoricEvents(
    fromSlot?: number,
    toSlot?: number,
  ): Promise<void> {
    if (this.isProcessingHistory) {
      console.log("[SOLANA] Already processing historic events");
      return;
    }

    this.isProcessingHistory = true;

    try {
      console.log("[SOLANA] 🔍 Starting historic event processing...");

      const currentSlot = await this.connection.getSlot();
      // For testing the specific transaction, include the slot where the Silver mint occurred
      const targetSlot = 402458188; // Slot where the Silver mint transaction occurred
      const startSlot =
        fromSlot ||
        Math.max(
          0,
          Math.min(targetSlot, this.lastProcessedSlot || currentSlot - 2000),
        );
      const endSlot = toSlot || currentSlot;

      console.log(
        "[SOLANA] Processing events from slot",
        startSlot,
        "to",
        endSlot,
      );

      // Get all signatures for the program within the slot range
      const signatures = await this.getSignaturesInSlotRange(
        startSlot,
        endSlot,
      );

      console.log("[SOLANA] Found", signatures.length, "signatures to process");

      if (signatures.length === 0) {
        console.log(
          "[SOLANA] No signatures found in range, updating processed slot to current",
        );
        this.lastProcessedSlot = endSlot;
        await this.saveLastProcessedState();
        return;
      }

      // Process signatures in batches to avoid overwhelming the RPC
      const batchSize = 10;
      let processedCount = 0;
      let newRecordsCount = 0;
      let updatedRecordsCount = 0;

      for (let i = 0; i < signatures.length; i += batchSize) {
        const batch = signatures.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((sig) => this.processHistoricTransactionWithDbCheck(sig)),
        );

        // Count successful processes
        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            processedCount++;
            if (result.value.action === "created") newRecordsCount++;
            if (result.value.action === "updated") updatedRecordsCount++;
          }
        });

        // Small delay between batches to be respectful to RPC
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update last processed state
      this.lastProcessedSlot = endSlot;
      await this.saveLastProcessedState();

      console.log("[SOLANA] ✓ Historic event processing completed:", {
        totalSignatures: signatures.length,
        processedEvents: processedCount,
        newRecords: newRecordsCount,
        updatedRecords: updatedRecordsCount,
        processedSlotRange: `${startSlot}-${endSlot}`,
      });
    } catch (error) {
      console.error("[SOLANA] Error processing historic events:", error);
    } finally {
      this.isProcessingHistory = false;
    }
  }

  /**
   * Get signatures within a slot range for both Gold and Silver programs
   */
  private async getSignaturesInSlotRange(
    fromSlot: number,
    toSlot: number,
  ): Promise<ConfirmedSignatureInfo[]> {
    try {
      // Get signatures for Gold, Silver programs AND SPL Token Program (for general transfers)
      const [goldSignatures, silverSignatures, splTokenSignatures] =
        await Promise.all([
          this.connection.getSignaturesForAddress(
            this.goldProgramId,
            { limit: 1000 },
            "confirmed",
          ),
          this.connection.getSignaturesForAddress(
            this.silverProgramId,
            { limit: 1000 },
            "confirmed",
          ),
          // Skip SPL Token historic processing to avoid rate limits
          // this.connection.getSignaturesForAddress(
          //   this.splTokenProgramId,
          //   { limit: 100 }, // Limit SPL Token to avoid too much noise
          //   "confirmed",
          // ),
          Promise.resolve([]), // Return empty array for SPL Token historic processing
        ]);

      // Combine and deduplicate signatures
      const allSignatures = [
        ...goldSignatures,
        ...silverSignatures,
        ...splTokenSignatures,
      ];
      const uniqueSignatures = allSignatures.filter(
        (sig, index, arr) =>
          arr.findIndex((s) => s.signature === sig.signature) === index,
      );

      // Filter by slot range and exclude already processed transactions
      const filteredSignatures = uniqueSignatures.filter(
        (sig) =>
          sig.slot >= fromSlot &&
          sig.slot <= toSlot &&
          !this.processedTransactions.has(sig.signature),
      );

      return filteredSignatures.sort((a, b) => a.slot - b.slot);
    } catch (error) {
      console.error("[SOLANA] Error getting signatures in slot range:", error);
      return [];
    }
  }

  /**
   * Process a historic transaction with database checks
   * Similar to Ethereum flow but adapted for Solana
   */
  private async processHistoricTransactionWithDbCheck(
    signatureInfo: ConfirmedSignatureInfo,
  ): Promise<{ action: "created" | "updated" | "skipped" } | null> {
    if (this.processedTransactions.has(signatureInfo.signature)) {
      return { action: "skipped" }; // Already processed in memory
    }

    try {
      const transaction = await this.connection.getParsedTransaction(
        signatureInfo.signature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        },
      );

      if (!transaction || transaction.meta?.err) {
        return null; // Skip failed transactions
      }

      let actionResult: { action: "created" | "updated" | "skipped" } | null =
        null;

      // Parse events from transaction logs
      if (transaction.meta?.logMessages) {
        const events = await this.parseEventsFromLogsWithReturn(
          transaction.meta.logMessages,
          signatureInfo.signature,
          signatureInfo.slot || 0,
        );

        // Also check for SPL token transfers
        const transferEvents = await this.parseTokenTransfers(
          transaction,
          transaction.meta.logMessages,
        );
        if (transferEvents.length > 0) {
          console.log(
            `[SOLANA] 🔍 Found ${transferEvents.length} token transfer events in transaction ${signatureInfo.signature}`,
          );
          events.push(...transferEvents);
        }

        console.log(
          "[SOLANA] 🔍 Processing",
          events.length,
          "events for historic transaction:",
          signatureInfo.signature,
        );

        // Process each event found
        for (const event of events) {
          const dbResult = await this.handleEventWithDbCheck(
            event,
            signatureInfo.signature,
            signatureInfo.slot || 0,
          );
          if (dbResult && dbResult.action !== "skipped") {
            actionResult = dbResult; // Keep track of the most significant action
          }
        }
      }

      // Also check for instructions directly (in case events are not emitted)
      await this.detectInstructionsFromTransaction(signatureInfo.signature);

      // Mark as processed in memory
      this.processedTransactions.add(signatureInfo.signature);

      return actionResult || { action: "skipped" };
    } catch (error) {
      console.error(
        "[SOLANA] Error processing historic transaction:",
        signatureInfo.signature,
        error,
      );
      return null;
    }
  }

  /**
   * Parse events from transaction logs using proper discriminators
   */
  private async parseEventsFromLogs(
    logs: string[],
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      const events = await this.parseEventsFromLogsWithReturn(
        logs,
        signature,
        slot,
      );

      // Ensure events is an array
      if (!Array.isArray(events)) {
        console.log(
          "[SOLANA] No events returned from parseEventsFromLogsWithReturn",
        );
        return;
      }

      // Process each event
      for (const event of events) {
        await this.handleParsedEvent(event, signature, slot);
      }
    } catch (error) {
      console.error("[SOLANA] Error in parseEventsFromLogs:", error);
    }
  }

  /**
   * Parse events from transaction logs and return them for database processing
   */
  private async parseEventsFromLogsWithReturn(
    logs: string[],
    signature: string,
    slot: number,
  ): Promise<any[]> {
    try {
      console.log(
        "[SOLANA] 🔍 Parsing events from logs for signature:",
        signature,
      );
      console.log("[SOLANA] Log messages count:", logs.length);

      // Event discriminators from your IDL
      const eventDiscriminators = {
        RedemptionRequested: [245, 155, 98, 131, 210, 25, 137, 146],
        RedemptionCancelled: [22, 106, 118, 26, 83, 110, 71, 174],
        SetRedemptionProcessing: [113, 21, 252, 209, 85, 199, 189, 75], // From actual transaction
        FulfillRedemption: [135, 55, 160, 245, 203, 83, 197, 146], // From actual transaction
      };

      let events: any[] = [];

      // Always try manual parsing as well for better coverage
      const manualEvents = await this.manualEventParsing(
        logs,
        eventDiscriminators,
      );
      console.log(
        "[SOLANA] Manual parsing found",
        manualEvents.length,
        "events",
      );
      if (manualEvents.length > 0) {
        console.log(
          "[SOLANA] Manual events detail:",
          manualEvents.map((e) => ({
            name: e.name,
            requestId: e.data?.requestId?.toString() || "undefined",
            amount: e.data?.amount?.toString() || "undefined",
          })),
        );
        events.push(...manualEvents);
      }

      // Remove duplicates based on event name and data
      const uniqueEvents = events.filter(
        (event, index, self) =>
          index ===
          self.findIndex(
            (e) =>
              e.name === event.name &&
              JSON.stringify(e.data || e) ===
                JSON.stringify(event.data || event),
          ),
      );

      console.log("[SOLANA] ✓ Total unique events found:", uniqueEvents.length);
      return uniqueEvents;
    } catch (error) {
      console.error("[SOLANA] Error parsing events from logs:", error);
      return [];
    }
  }

  /**
   * Manual event parsing fallback
   */
  private async manualEventParsing(
    logs: string[],
    discriminators: any,
  ): Promise<any[]> {
    const events = [];

    try {
      console.log(
        "[SOLANA] 🔍 Manual parsing - checking",
        logs.length,
        "log messages",
      );
      for (const log of logs) {
        console.log("[SOLANA] 🔍 Checking log:", log);
        // Look for program data logs specifically
        if (log.includes("Program data:")) {
          console.log("[SOLANA] ✓ Found program data log!");
          const dataMatch = log.match(/Program data:\s*(.+)/);
          if (dataMatch) {
            const base64Data = dataMatch[1].trim();

            try {
              const buffer = Buffer.from(base64Data, "base64");

              // Check for RedemptionRequested discriminator: [245, 155, 98, 131, 210, 25, 137, 146]
              const discriminator = Array.from(buffer.slice(0, 8));
              const redemptionRequestedDiscriminator = [
                245, 155, 98, 131, 210, 25, 137, 146,
              ];

              if (
                JSON.stringify(discriminator) ===
                JSON.stringify(redemptionRequestedDiscriminator)
              ) {
                // Parse RedemptionRequested event data
                const userBytes = buffer.slice(8, 40);
                const requestIdBytes = buffer.slice(40, 48);
                const amountBytes = buffer.slice(48, 56);
                const timestampBytes = buffer.slice(56, 64);

                // Convert user bytes to PublicKey
                const user = new PublicKey(userBytes);

                // Properly parse the BN values from the buffer
                const requestIdValue = requestIdBytes.readBigUInt64LE(0);
                const amountValue = amountBytes.readBigUInt64LE(0);
                const timestampValue = timestampBytes.readBigInt64LE(0);

                console.log("[SOLANA] 🔍 Manual parsing - decoded values:", {
                  requestIdValue: requestIdValue.toString(),
                  amountValue: amountValue.toString(),
                  timestampValue: timestampValue.toString(),
                });

                const eventData = {
                  user: user,
                  requestId: new BN(requestIdValue.toString()), // Use requestId not request_id for consistency
                  amount: new BN(amountValue.toString()),
                  timestamp: new BN(timestampValue.toString()),
                };

                events.push({
                  name: "RedemptionRequested",
                  data: eventData,
                });

                console.log(
                  "[SOLANA] 🎉 Manual parsing found RedemptionRequested event:",
                  {
                    user: user.toString(),
                    requestId: eventData.requestId.toString(),
                    amount: eventData.amount.toString(),
                    timestamp: eventData.timestamp.toString(),
                  },
                );
              }

              // **NEW: Add RedemptionCancelled discriminator check**
              const redemptionCancelledDiscriminator = [
                22, 106, 118, 26, 83, 110, 71, 174,
              ]; // From IDL

              if (
                JSON.stringify(discriminator) ===
                JSON.stringify(redemptionCancelledDiscriminator)
              ) {
                // Parse RedemptionCancelled event data (same structure as RedemptionRequested)
                const userBytes = buffer.slice(8, 40);
                const requestIdBytes = buffer.slice(40, 48);
                const amountBytes = buffer.slice(48, 56);
                const timestampBytes = buffer.slice(56, 64);

                // Convert user bytes to PublicKey
                const user = new PublicKey(userBytes);

                // Properly parse the BN values from the buffer
                const requestIdValue = requestIdBytes.readBigUInt64LE(0);
                const amountValue = amountBytes.readBigUInt64LE(0);
                const timestampValue = timestampBytes.readBigInt64LE(0);

                console.log(
                  "[SOLANA] 🔍 Manual parsing - CancelRedemption decoded values:",
                  {
                    requestIdValue: requestIdValue.toString(),
                    amountValue: amountValue.toString(),
                    timestampValue: timestampValue.toString(),
                  },
                );

                const eventData = {
                  user: user,
                  requestId: new BN(requestIdValue.toString()), // Use requestId not request_id for consistency
                  amount: new BN(amountValue.toString()),
                  timestamp: new BN(timestampValue.toString()),
                };

                events.push({
                  name: "RedemptionCancelled",
                  data: eventData,
                });

                console.log(
                  "[SOLANA] 🎉 Manual parsing found RedemptionCancelled event:",
                  {
                    user: user.toString(),
                    requestId: eventData.requestId.toString(),
                    amount: eventData.amount.toString(),
                    timestamp: eventData.timestamp.toString(),
                  },
                );

                // Debug: Log the complete event structure being passed
                console.log(
                  "[SOLANA] Debug - Complete CancelRedemption event structure:",
                  {
                    eventName: "RedemptionCancelled",
                    eventData: JSON.stringify(eventData, (key, value) =>
                      typeof value === "bigint" ? value.toString() : value,
                    ),
                    dataKeys: Object.keys(eventData),
                  },
                );

                // Debug: Log the complete event structure being passed
                console.log("[SOLANA] Debug - Complete event structure:", {
                  eventName: "RedemptionRequested",
                  eventData: JSON.stringify(eventData, (key, value) =>
                    typeof value === "bigint" ? value.toString() : value,
                  ),
                  dataKeys: Object.keys(eventData),
                });
              }

              // **NEW: Add Mint discriminator check**
              // Note: You'll need to get the actual discriminator from your IDL
              const mintDiscriminator = [51, 57, 225, 47, 182, 146, 137, 166]; // Placeholder - replace with actual

              if (
                JSON.stringify(discriminator) ===
                JSON.stringify(mintDiscriminator)
              ) {
                console.log("[SOLANA] 🎉 Manual parsing found Mint event");

                const userBytes = buffer.slice(8, 40);
                const amountBytes = buffer.slice(40, 48);

                const user = new PublicKey(userBytes);
                const amountValue = amountBytes.readBigUInt64LE(0);

                events.push({
                  name: "Mint",
                  data: {
                    user: user,
                    amount: new BN(amountValue.toString()),
                    request_id: new BN("0"), // May not have requestId
                  },
                });

                console.log("[SOLANA] 🎉 Manual parsing found Mint event:", {
                  user: user.toString(),
                  amount: amountValue.toString(),
                });
              }

              // **NEW: Add FulfillRedemption discriminator check**
              const fulfillRedemptionDiscriminator = [
                135, 55, 160, 245, 203, 83, 197, 146,
              ]; // From actual transaction gWy9uKzTSVnb2ivt6NqzC9oyodifRn74jo327Nij9iosZDp3hc3XkQpAUrgtWWRWXTDZrhUsz7qvRtLgp1cf3wX

              if (
                JSON.stringify(discriminator) ===
                JSON.stringify(fulfillRedemptionDiscriminator)
              ) {
                console.log(
                  "[SOLANA] 🎉 Manual parsing found FulfillRedemption event",
                );

                const userBytes = buffer.slice(8, 40);
                const requestIdBytes = buffer.slice(40, 48);
                const amountBytes = buffer.slice(48, 56);

                const user = new PublicKey(userBytes);
                const requestIdValue = requestIdBytes.readBigUInt64LE(0);
                const amountValue = amountBytes.readBigUInt64LE(0);

                events.push({
                  name: "FulfillRedemption",
                  data: {
                    user: user,
                    request_id: new BN(requestIdValue.toString()),
                    amount: new BN(amountValue.toString()),
                  },
                });

                console.log(
                  "[SOLANA] 🎉 Manual parsing found FulfillRedemption event:",
                  {
                    user: user.toString(),
                    requestId: requestIdValue.toString(),
                    amount: amountValue.toString(),
                  },
                );
              }

              // **FIXED: Add event discriminator checks with actual values from transactions**
              const mintTokensDiscriminator = [
                207, 212, 128, 194, 175, 54, 64, 24,
              ]; // From actual Silver mint transaction

              if (
                JSON.stringify(discriminator) ===
                JSON.stringify(mintTokensDiscriminator)
              ) {
                console.log(
                  "[SOLANA] 🎉 Manual parsing found MintTokens event",
                );

                const userBytes = buffer.slice(8, 40);
                const amountBytes = buffer.slice(40, 48);

                const user = new PublicKey(userBytes);
                const amountValue = amountBytes.readBigUInt64LE(0);

                events.push({
                  name: "MintTokens",
                  data: {
                    user: user,
                    amount: new BN(amountValue.toString()),
                    request_id: new BN("0"), // May not have requestId
                  },
                });

                console.log(
                  "[SOLANA] 🎉 Manual parsing found MintTokens event:",
                  {
                    user: user.toString(),
                    amount: amountValue.toString(),
                  },
                );
              }

              // **NEW: Add SetRedemptionProcessing discriminator check**
              const setRedemptionProcessingDiscriminator = [
                113, 21, 252, 209, 85, 199, 189, 75,
              ]; // From actual transaction 53WpuEudqbPXuv7zQBwDZ6pC39kDE4FLYArA3bhoMMRkHVV6Fc6cnkPyXtiNF14WUGjdRKjfMEo6JDoSCSbkpz5E

              if (
                JSON.stringify(discriminator) ===
                JSON.stringify(setRedemptionProcessingDiscriminator)
              ) {
                console.log(
                  "[SOLANA] 🎉 Manual parsing found SetRedemptionProcessing event",
                );

                const userBytes = buffer.slice(8, 40);
                const requestIdBytes = buffer.slice(40, 48);

                const user = new PublicKey(userBytes);
                const requestIdValue = requestIdBytes.readBigUInt64LE(0);

                events.push({
                  name: "SetRedemptionProcessing",
                  data: {
                    user: user,
                    request_id: new BN(requestIdValue.toString()),
                    status: "processing", // Default status
                  },
                });

                console.log(
                  "[SOLANA] 🎉 Manual parsing found SetRedemptionProcessing event:",
                  {
                    user: user.toString(),
                    requestId: requestIdValue.toString(),
                    status: "processing",
                  },
                );
              }
            } catch (parseError) {
              console.log(
                "[SOLANA] Failed to parse program data:",
                parseError.message,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("[SOLANA] Error in manual event parsing:", error);
    }

    return events;
  }

  /**
   * Simple SPL token transfer detection - just check for signature and update status
   */
  private async parseTokenTransfers(
    transaction: any,
    logs: string[],
  ): Promise<any[]> {
    const transferEvents = [];

    try {
      // Check if this transaction has a TransferChecked instruction
      const hasTransferChecked = logs.some((log) =>
        log.includes("Instruction: TransferChecked"),
      );

      if (hasTransferChecked) {
        console.log("[SOLANA] 🔍 Detected TransferChecked instruction");

        // Add a simple transfer event to trigger database lookup
        transferEvents.push({
          name: "Transfer",
          data: {
            signature: transaction.transaction?.signatures?.[0] || "unknown",
          },
        });
      }
    } catch (error) {
      console.error("[SOLANA] Error parsing token transfers:", error);
    }

    return transferEvents;
  }

  /**
   * Check if data matches event discriminator
   */
  private matchesDiscriminator(data: string, discriminator: number[]): boolean {
    try {
      // This is a simplified check - implement based on your actual data format
      return data.length > 16; // Basic length check
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse event data (simplified implementation)
   */
  private parseEventData(data: string, eventName: string): any {
    // This is a placeholder - implement actual parsing based on your event structure
    // You might need to decode base64, parse borsh, etc.
    return {
      // Default values - replace with actual parsing
      user: new PublicKey("11111111111111111111111111111111"),
      amount: new BN(0),
      requestId: new BN(0),
      timestamp: new BN(Date.now() / 1000),
    };
  }

  /**
   * Handle parsed event with enhanced instruction detection
   */
  private async handleParsedEvent(
    event: any,
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      const eventName = event.name;
      console.log(`[SOLANA] Processing event: ${eventName}`);

      switch (eventName) {
        case "RedemptionRequested":
        case "redemptionRequested": // Handle case variations
          await this.handleRedemptionRequestedEvent(
            event.data,
            slot,
            signature,
          );
          break;
        case "RedemptionCancelled":
        case "redemptionCancelled":
          console.log(
            "[SOLANA] ✓ RedemptionCancelled event detected, processing with DB check logic",
          );
          // Use the enhanced DB check method instead of the old handler
          const result = await this.handleEventWithDbCheck(
            event,
            signature,
            slot,
          );
          console.log(
            "[SOLANA] ✓ RedemptionCancelled processed with result:",
            result,
          );
          break;
        case "RedemptionFulfilled":
        case "redemptionFulfilled":
          await this.handleRedemptionFulfilledEvent(
            event.data,
            slot,
            signature,
          );
          break;
        case "Mint":
        case "mint":
          await this.handleMintEvent(event.data, slot, signature);
          break;
        case "FulfillRedemption":
        case "fulfillRedemption":
          await this.handleFulfillRedemptionEvent(event.data, slot, signature);
          break;
        case "MintTokens":
        case "mintTokens":
          await this.handleMintTokensEvent(event.data, slot, signature);
          break;
        case "SetRedemptionProcessing":
        case "setRedemptionProcessing":
          await this.handleSetRedemptionProcessingEvent(
            event.data,
            slot,
            signature,
          );
          break;
        case "Transfer":
        case "transfer":
          await this.handleSolanaTransferEvent(event.data, slot, signature);
          break;
        default:
          console.log("[SOLANA] Unknown event type:", eventName);
      }
    } catch (error) {
      console.error("[SOLANA] Error handling parsed event:", error);
    }
  }

  /**
   * Handle Solana Transfer Event - Simple signature-based status update
   */
  private async handleSolanaTransferEvent(
    eventData: any,
    slot: number,
    signature: string,
  ): Promise<void> {
    try {
      console.log(
        "[SOLANA] 🔍 Processing Transfer event for signature:",
        signature,
      );

      // Wait for potential frontend gifting record creation
      console.log(
        "[SOLANA] ⏳ Initial wait of 500ms for frontend gifting record creation...",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Look for existing gifting record by transaction hash
      const existingGifting =
        await storage.getGiftingByTransactionHash(signature);

      if (existingGifting) {
        console.log(
          "[SOLANA] ✅ Found existing gifting record, updating to success",
        );

        // Update existing record to success
        const updateResult = await storage.updateGiftingStatus(
          existingGifting._id,
          "success",
          signature,
        );

        if (updateResult) {
          console.log("[SOLANA] ✅ Updated gifting record to success:", {
            giftingId: existingGifting._id,
            transactionHash: signature,
          });

          // Check if notification was already sent
          if (!existingGifting.notified) {
            // Send email notification for transfer
            try {
              await BlockchainEmailService.sendBlockchainEventNotification({
                eventType: "TRANSFER",
                network: "Solana",
                walletAddress: existingGifting.recipientWallet || "unknown",
                transactionHash: signature,
                tokenType:
                  (existingGifting.token?.toUpperCase() as "GOLD" | "SILVER") ||
                  "GOLD",
                amount: existingGifting.quantity || "N/A",
                fromAddress: "solana_sender",
                toAddress: existingGifting.recipientWallet || "unknown",
              });

              // Update notified status
              await storage.updateGifting(existingGifting._id, {
                notified: true,
              });

              console.log(
                "[SOLANA] 📧 Transfer notification sent and marked as notified:",
                {
                  giftingId: existingGifting._id,
                  transactionHash: signature,
                },
              );
            } catch (emailError) {
              console.error(
                "[SOLANA] Failed to send transfer notification:",
                emailError,
              );
            }
          } else {
            console.log(
              "[SOLANA] Transfer notification already sent for:",
              signature,
            );
          }
        }
      } else {
        console.log(
          "[SOLANA] ⚠️ No existing gifting record found for signature:",
          signature,
        );
      }
    } catch (error) {
      console.error("[SOLANA] Error handling transfer event:", error);
    }
  }

  /**
   * Handle event with database checks and signature matching
   * This is the critical method that matches signatures to transactionHash and updates requestId
   */
  private async handleEventWithDbCheck(
    event: any,
    signature: string,
    slot: number,
  ): Promise<{ action: "created" | "updated" | "skipped" } | null> {
    try {
      if (!event || (!event.data && !event.name)) {
        console.log("[SOLANA] Invalid event structure, skipping");
        return { action: "skipped" };
      }

      const eventData = event.data || event;
      const eventName = event.name || "Unknown";

      console.log("[SOLANA] 🔍 Processing event with DB check:", {
        eventName,
        signature,
        slot,
        eventDataKeys: Object.keys(eventData || {}),
        eventDataValues: Object.entries(eventData || {}).reduce(
          (acc, [key, value]) => {
            acc[key] = value?.toString ? value.toString() : String(value);
            return acc;
          },
          {} as Record<string, string>,
        ),
        rawEventData: eventData,
      });

      if (eventName === "MintTokens")
        this.handleMintTokensEvent(eventData, slot, signature);
      else if (
        eventName === "RedemptionRequested" ||
        eventName === "redemptionRequested"
      ) {
        // **CRITICAL FIX**: Handle BN object decoding before passing to database method
        let processedEventData = { ...eventData };

        // Check if requestId needs BN decoding fix
        if (
          eventData.requestId &&
          typeof eventData.requestId === "object" &&
          eventData.requestId.constructor.name === "BN"
        ) {
          console.log("[SOLANA] 🔧 Pre-processing BN objects before DB check");
          processedEventData.requestId = eventData.requestId.toString();
          console.log(
            "[SOLANA] ✅ Fixed requestId BN:",
            eventData.requestId.toString(),
          );
        }

        return await this.handleRedemptionRequestedEventWithDbCheckOLD(
          processedEventData,
          slot,
          signature,
        );
      } else if (
        eventName === "RedemptionCancelled" ||
        eventName === "redemptionCancelled"
      ) {
        // **NEW**: Handle cancellation events with the same field mapping logic as RedemptionRequested
        let processedEventData = { ...eventData };

        // Check if requestId needs BN decoding fix
        if (
          eventData.requestId &&
          typeof eventData.requestId === "object" &&
          eventData.requestId.constructor.name === "BN"
        ) {
          console.log(
            "[SOLANA] 🔧 Pre-processing BN objects before CancelRedemption DB check",
          );
          processedEventData.requestId = eventData.requestId.toString();
          console.log(
            "[SOLANA] ✅ Fixed requestId BN for CancelRedemption:",
            eventData.requestId.toString(),
          );
        }

        return await this.handleRedemptionCancelledEventWithDbCheck(
          processedEventData,
          slot,
          signature,
        );
      }

      return { action: "skipped" };
    } catch (error) {
      console.error("[SOLANA] Error in handleEventWithDbCheck:", error);
      return null;
    }
  }

  /**
   * Handle RedemptionRequested event with database checks and signature matching
   */
  private async handleRedemptionRequestedEventWithDbCheckOLD(
    eventData: any,
    slot: number,
    signature?: string,
  ): Promise<{ action: "created" | "updated" | "skipped" }> {
    try {
      // Enhanced BN object extraction with proper decoding
      const userStr = eventData.user?.toString() || "unknown";

      // Handle BN objects properly for numeric fields
      let amountStr = "0";
      let requestIdStr = "0";
      let timestampStr = String(Date.now() / 1000);

      // Decode amount from BN object
      if (eventData.amount) {
        amountStr = eventData.amount.toString();
      }

      // Decode requestId from BN object - critical fix for database matching
      if (eventData.requestId || eventData.request_id) {
        const requestIdBN = eventData.requestId || eventData.request_id;

        // Enhanced BN decoding with proper toString() handling
        console.log("[SOLANA] 🔍 Decoding requestId BN object:", {
          type: typeof requestIdBN,
          constructor: requestIdBN?.constructor?.name,
          hasToString: typeof requestIdBN?.toString === "function",
          bnValue: requestIdBN,
          stringValue: String(requestIdBN),
        });

        if (requestIdBN && typeof requestIdBN.toString === "function") {
          requestIdStr = requestIdBN.toString();
          console.log(
            "[SOLANA] ✓ Decoded requestId from toString():",
            requestIdStr,
          );
        } else if (typeof requestIdBN === "string") {
          // Check if it's a hex string and convert to decimal
          if (requestIdBN.match(/^[0-9a-f]+$/i)) {
            requestIdStr = parseInt(requestIdBN, 16).toString();
            console.log(
              "[SOLANA] ✓ Converted hex string to decimal:",
              requestIdBN,
              "→",
              requestIdStr,
            );
          } else {
            requestIdStr = requestIdBN;
            console.log(
              "[SOLANA] ✓ RequestId already a decimal string:",
              requestIdStr,
            );
          }
        } else if (typeof requestIdBN === "number") {
          requestIdStr = requestIdBN.toString();
          console.log(
            "[SOLANA] ✓ Decoded requestId from number:",
            requestIdStr,
          );
        } else {
          console.log(
            "[SOLANA] ⚠️ Unable to decode requestId, using default 0",
          );
          requestIdStr = "0";
        }
      }

      // Decode timestamp from BN object
      if (eventData.timestamp) {
        timestampStr = eventData.timestamp.toString();
      }

      console.log(
        "[SOLANA] 🔍 Checking database for existing redemption with signature:",
        signature,
      );

      // **RACE CONDITION FIX**: Wait initial 500ms for frontend record creation, then retry mechanism
      console.log(
        "[SOLANA] ⏳ Initial wait of 500ms for frontend record creation...",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      let existingRedemption = null;
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 500; // 500ms delay between retries as requested

      while (retryCount < maxRetries && !existingRedemption) {
        existingRedemption = await storage.getRedemptionByTransactionHash(
          signature || "",
        );

        if (!existingRedemption) {
          console.log(
            `[SOLANA] ⏳ Redemption record not found (attempt ${retryCount + 1}/${maxRetries}), waiting for frontend creation...`,
          );
          console.log(`[SOLANA] 🔍 Searching for signature: ${signature}`);

          if (retryCount < maxRetries - 1) {
            // Wait before next retry with longer delay
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        } else {
          console.log(
            `[SOLANA] ✅ Found redemption record on attempt ${retryCount + 1}`,
          );
        }

        retryCount++;
      }

      console.log(
        "[SOLANA] 📋 Final result after initial wait + ",
        retryCount,
        "retry attempts:",
        existingRedemption ? "FOUND" : "NOT_FOUND",
      );
      if (existingRedemption) {
        console.log("[SOLANA] ✓ Found existing redemption record:", {
          id: existingRedemption._id,
          currentRequestId: existingRedemption.requestId,
          newRequestId: requestIdStr,
          transactionHash: existingRedemption.transactionHash,
          shouldUpdate:
            !existingRedemption.requestId ||
            existingRedemption.requestId === "0" ||
            requestIdStr !== existingRedemption.requestId,
        });

        // **CRITICAL FIX**: Update if requestId is missing, '0', or different from parsed event
        if (
          !existingRedemption.requestId ||
          existingRedemption.requestId === "0" ||
          requestIdStr !== existingRedemption.requestId
        ) {
          console.log("[SOLANA] 🔄 Updating redemption record:", {
            before: { requestId: existingRedemption.requestId },
            after: { requestId: requestIdStr },
            reason: !existingRedemption.requestId
              ? "missing requestId"
              : existingRedemption.requestId === "0"
                ? "requestId is zero"
                : "requestId mismatch",
          });

          // Check if request notification has already been sent
          const alreadyRequestNotified =
            existingRedemption.notificationStatus?.requestNotified || false;

          // Update the existing record with the correct requestId from the parsed event but DON'T mark notification as sent yet
          await storage.updateRedemption(existingRedemption._id!.toString(), {
            requestId: requestIdStr,
            updatedAt: new Date(),
          });

          // Send email notification for redemption request if not already notified
          if (!alreadyRequestNotified) {
            try {
              await BlockchainEmailService.sendBlockchainEventNotification({
                eventType: "REQUEST_REDEMPTION",
                network: "Solana",
                walletAddress: userStr,
                transactionHash: signature || "",
                tokenType: "GOLD" as "GOLD" | "SILVER", // Default to GOLD, will be enhanced based on program ID
                amount: amountStr,
                requestId: requestIdStr,
              });

              // Only set notified flag AFTER successful email sending
              await storage.updateRedemption(
                existingRedemption._id!.toString(),
                {
                  notificationStatus: {
                    requestNotified: true,
                    processingNotified:
                      existingRedemption.notificationStatus
                        ?.processingNotified || false,
                    fulfilledNotified:
                      existingRedemption.notificationStatus
                        ?.fulfilledNotified || false,
                    cancelledNotified:
                      existingRedemption.notificationStatus
                        ?.cancelledNotified || false,
                  },
                },
              );

              console.log(
                `[SOLANA] 📧 Redemption request notification sent with requestNotified tracking:`,
                {
                  redemptionId: existingRedemption._id,
                  transactionHash: signature,
                  requestId: requestIdStr,
                },
              );
            } catch (emailError) {
              console.error(
                "[SOLANA] Failed to send redemption request notification:",
                emailError,
              );
            }
          } else {
            console.log(
              "[SOLANA] ℹ️ RequestRedemption email notification already sent, skipping duplicate",
            );
          }

          console.log(
            "[SOLANA] ✅ SIGNATURE MATCH SUCCESS - Updated existing redemption:",
            {
              id: existingRedemption._id,
              oldRequestId: existingRedemption.requestId,
              newRequestId: requestIdStr,
              signature,
              success: true,
            },
          );

          return { action: "updated" as const };
        } else {
          console.log(
            "[SOLANA] Redemption already has correct requestId, checking notification status:",
            {
              currentRequestId: existingRedemption.requestId,
              parsedRequestId: requestIdStr,
              match: existingRedemption.requestId === requestIdStr,
              requestNotified:
                existingRedemption.notificationStatus?.requestNotified || false,
            },
          );

          // Even if requestId matches, check if email notification was sent
          const alreadyRequestNotified =
            existingRedemption.notificationStatus?.requestNotified || false;

          if (!alreadyRequestNotified) {
            console.log(
              "[SOLANA] Email notification not sent yet, sending now...",
            );
            try {
              await BlockchainEmailService.sendBlockchainEventNotification({
                eventType: "REQUEST_REDEMPTION",
                network: "Solana",
                walletAddress: userStr,
                transactionHash: signature || "",
                tokenType: "GOLD" as "GOLD" | "SILVER", // Default to GOLD, will be enhanced based on program ID
                amount: amountStr,
                requestId: requestIdStr,
              });

              // Only set notified flag AFTER successful email sending
              await storage.updateRedemption(
                existingRedemption._id!.toString(),
                {
                  notificationStatus: {
                    requestNotified: true,
                    processingNotified:
                      existingRedemption.notificationStatus
                        ?.processingNotified || false,
                    fulfilledNotified:
                      existingRedemption.notificationStatus
                        ?.fulfilledNotified || false,
                    cancelledNotified:
                      existingRedemption.notificationStatus
                        ?.cancelledNotified || false,
                  },
                },
              );

              console.log(
                `[SOLANA] 📧 Redemption request notification sent for existing record:`,
                {
                  redemptionId: existingRedemption._id,
                  transactionHash: signature,
                  requestId: requestIdStr,
                },
              );

              return { action: "updated" as const };
            } catch (emailError) {
              console.error(
                "[SOLANA] Failed to send redemption request notification:",
                emailError,
              );
              return { action: "skipped" };
            }
          } else {
            console.log(
              "[SOLANA] ℹ️ RequestRedemption email notification already sent, skipping duplicate",
            );
            return { action: "skipped" };
          }
        }
      } else {
        // **FIXED**: No existing redemption found by signature - this is expected for most blockchain events
        // In proper flow, redemption records should already exist from user actions,
        // and we only update them with blockchain event data (like requestId)
        console.log(
          "[SOLANA] ℹ️ No existing redemption found for signature:",
          signature,
        );
        console.log(
          "[SOLANA] ℹ️ This is expected - blockchain events should update existing user-created redemption records, not create new ones",
        );

        // Log the wallet address that initiated the blockchain transaction for debugging
        console.log("[SOLANA] 📝 Blockchain event details:", {
          walletAddress: userStr,
          requestId: requestIdStr,
          amount: amountStr,
          signature: signature,
          note: "No matching redemption record found to update",
        });

        return {
          action: "skipped",
          reason: "No existing redemption record to update",
        };
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error in handleRedemptionRequestedEventWithDbCheck:",
        error,
      );
      return { action: "skipped" };
    }
  }

  /**
   * Enhanced instruction detection from transaction
   */
  private async detectInstructionsFromTransaction(
    signature: string,
  ): Promise<void> {
    try {
      const transaction = await this.connection.getParsedTransaction(
        signature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        },
      );

      if (!transaction || transaction.meta?.err) {
        return;
      }

      // Check for program instructions
      const instructions = transaction.transaction.message.instructions;

      for (const instruction of instructions) {
        if (
          "programId" in instruction &&
          (instruction.programId.toString() === this.goldProgramId.toString() ||
            instruction.programId.toString() ===
              this.silverProgramId.toString())
        ) {
          // Decode instruction data to identify instruction type
          const instructionData = "data" in instruction ? instruction.data : "";

          // Check for redemption-related instructions using discriminators
          if (this.isRedemptionRequestInstruction(instructionData)) {
            console.log(
              "[SOLANA] Detected request_redemption instruction in:",
              signature,
            );
            await this.handleRedemptionRequestInstruction(
              instruction,
              signature,
              transaction.slot || 0,
            );
          } else if (this.isCancelRedemptionInstruction(instructionData)) {
            console.log(
              "[SOLANA] Detected cancel_redemption instruction in:",
              signature,
            );
            await this.handleCancelRedemptionInstruction(
              instruction,
              signature,
              transaction.slot || 0,
            );
          }
        }
      }
    } catch (error) {
      console.error("[SOLANA] Error detecting instructions:", error);
    }
  }

  /**
   * Check if instruction is request_redemption
   */
  private isRedemptionRequestInstruction(data: string): boolean {
    try {
      // Discriminator for request_redemption: [14, 62, 182, 237, 59, 79, 149, 22]
      const discriminator = [14, 62, 182, 237, 59, 79, 149, 22];
      return this.matchesInstructionDiscriminator(data, discriminator);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if instruction is cancel_redemption
   */
  private isCancelRedemptionInstruction(data: string): boolean {
    try {
      // Discriminator for cancel_redemption: [197, 243, 101, 86, 2, 37, 105, 106]
      const discriminator = [197, 243, 101, 86, 2, 37, 105, 106];
      return this.matchesInstructionDiscriminator(data, discriminator);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if instruction data matches discriminator
   */
  private matchesInstructionDiscriminator(
    data: string,
    discriminator: number[],
  ): boolean {
    try {
      // Decode base58 data
      const buffer = Buffer.from(data, "base64");

      // Check if first 8 bytes match discriminator
      if (buffer.length < 8) return false;

      for (let i = 0; i < 8; i++) {
        if (buffer[i] !== discriminator[i]) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle redemption request instruction
   */
  private async handleRedemptionRequestInstruction(
    instruction: any,
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      // Extract account information from instruction
      const accounts = instruction.accounts || [];

      // Based on your IDL structure:
      // 0: user, 1: config, 2: redemption_request, 3: user_token_account, 4: mint, 5: redemption_pda, 6: token_program, 7: system_program

      if (accounts.length >= 5) {
        const userPubkey = accounts[0];
        const mintPubkey = accounts[4];

        // Decode instruction data to get amount
        const amount = this.decodeRedemptionAmount(instruction.data);

        console.log("[SOLANA] Processing redemption request instruction:", {
          user: userPubkey.toString(),
          mint: mintPubkey.toString(),
          amount: amount.toString(),
          signature,
          slot,
        });

        // Create event-like data structure for consistent handling
        const eventData = {
          user: new PublicKey(userPubkey),
          request_id: new BN(Date.now()), // Use underscore format to match interface
          amount: new BN(amount),
          timestamp: new BN(Date.now() / 1000),
          mint: new PublicKey(mintPubkey),
          tokenType: this.getTokenTypeFromMint(mintPubkey.toString()),
        };

        await this.handleRedemptionRequestedEvent(eventData, slot, signature);
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error handling redemption request instruction:",
        error,
      );
    }
  }

  /**
   * Handle cancel redemption instruction
   */
  private async handleCancelRedemptionInstruction(
    instruction: any,
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      // Extract account information from instruction
      const accounts = instruction.accounts || [];

      // Based on your IDL: 0: user, 1: redemption_request, 2: user_token_account, 3: token_program
      if (accounts.length >= 2) {
        const userPubkey = accounts[0];
        const redemptionRequestPubkey = accounts[1];

        console.log("[SOLANA] Processing cancel redemption instruction:", {
          user: userPubkey.toString(),
          redemptionRequest: redemptionRequestPubkey.toString(),
          signature,
          slot,
        });

        // You'll need to fetch the redemption request account to get details
        await this.handleCancelRedemptionFromInstruction(
          userPubkey,
          redemptionRequestPubkey,
          signature,
          slot,
        );
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error handling cancel redemption instruction:",
        error,
      );
    }
  }

  /**
   * Decode redemption amount from instruction data
   */
  private decodeRedemptionAmount(data: string): number {
    try {
      const buffer = Buffer.from(data, "base64");

      // Skip discriminator (first 8 bytes) and decode u64 amount
      if (buffer.length >= 16) {
        // Read u64 from bytes 8-15 (little endian)
        const amountBuffer = buffer.subarray(8, 16);
        return Number(amountBuffer.readBigUInt64LE(0));
      }

      return 0;
    } catch (error) {
      console.error("[SOLANA] Error decoding amount:", error);
      return 0;
    }
  }

  /**
   * Handle cancellation from instruction (when no event is emitted)
   */
  private async handleCancelRedemptionFromInstruction(
    userPubkey: string,
    redemptionRequestPubkey: string,
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      // Try to fetch redemption request account data
      const accountInfo = await this.connection.getAccountInfo(
        new PublicKey(redemptionRequestPubkey),
      );

      if (accountInfo) {
        // Decode account data to get redemption details
        // This would require implementing the account data structure from your program

        // For now, create a synthetic event
        const eventData = {
          user: new PublicKey(userPubkey),
          request_id: new BN(Date.now()), // Use underscore format to match interface
          amount: new BN(0), // Would extract from account data
          timestamp: new BN(Date.now() / 1000),
          mint: new PublicKey(redemptionRequestPubkey), // Placeholder, would extract from account data
          tokenType: "GOLD" as const, // Would extract from account data
        };

        await this.handleRedemptionCancelledEvent(eventData, slot, signature);
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error handling cancellation from instruction:",
        error,
      );
    }
  }

  /**
   * Get token type from mint address
   */
  private getTokenTypeFromMint(mintAddress: string): string {
    if (mintAddress === this.goldTokenMint.toString()) {
      return "GOLD";
    } else if (mintAddress === this.silverTokenMint.toString()) {
      return "SILVER";
    }
    return "GOLD"; // Default
  }

  /**
   * Start listening for Solana blockchain events
   */
  async startListening(processHistory: boolean = true): Promise<void> {
    if (this.isListening) {
      console.log("[SOLANA] Already listening for Solana events");
      return;
    }

    try {
      await this.initializePrograms();

      // Process historic events first if requested
      if (processHistory) {
        await this.processHistoricEvents();
      }

      // Get current slot to start listening from
      this.lastProcessedSlot = await this.connection.getSlot();

      // Skip real-time event listeners since we're using manual parsing
      // Instead, set up signature monitoring for both programs
      await this.setupSignatureMonitoring();

      // Skip account change listeners to avoid reference error
      // await this.setupAccountChangeListeners();

      // Also set up account closure monitoring
      await this.monitorAccountClosures();

      this.isListening = true;
      this.reconnectAttempts = 0;

      console.log(
        "[SOLANA] Started listening for Solana blockchain events from slot:",
        this.lastProcessedSlot,
      );
    } catch (error) {
      console.error("[SOLANA] Failed to start Solana listener:", error);
      await this.handleConnectionError();
    }
  }

  /**
   * Setup real-time signature monitoring for both Gold and Silver programs
   */
  private async setupSignatureMonitoring(): Promise<void> {
    try {
      console.log(
        "[SOLANA] Setting up real-time signature monitoring for both Gold and Silver programs",
      );

      // Use polling-based monitoring instead of onSignature which requires specific signature
      // onSignature requires knowing the exact signature beforehand, which we don't have for real-time events

      // Set up polling for new signatures as fallback
      this.setupSignaturePolling();

      console.log(
        "[SOLANA] Real-time signature monitoring set up successfully",
      );
    } catch (error) {
      console.error("[SOLANA] Failed to set up signature monitoring:", error);
      throw error;
    }
  }

  /**
   * Setup signature polling as fallback for real-time monitoring
   */
  private setupSignaturePolling(): void {
    const pollingInterval = setInterval(async () => {
      try {
        await this.checkForNewSignatures();
      } catch (error) {
        console.error("[SOLANA] Error in signature polling:", error);
      }
    }, 5000); // Poll every 5 seconds

    // Store interval for cleanup
    if (!this.eventListenerIds) this.eventListenerIds = [];
    this.eventListenerIds.push(pollingInterval as any);
  }

  /**
   * Check for new signatures since last processed slot
   */
  private async checkForNewSignatures(): Promise<void> {
    try {
      const currentSlot = await this.connection.getSlot();

      // Only check if there are new slots
      if (currentSlot <= this.lastProcessedSlot) {
        return;
      }

      // Get recent signatures for both programs AND SPL Token Program
      const [goldSignatures, silverSignatures, splTokenSignatures] =
        await Promise.all([
          this.connection.getSignaturesForAddress(
            this.goldProgramId,
            { limit: 10 },
            "confirmed",
          ),
          this.connection.getSignaturesForAddress(
            this.silverProgramId,
            { limit: 10 },
            "confirmed",
          ),
          // Skip SPL Token real-time monitoring to avoid rate limits
          // this.connection.getSignaturesForAddress(
          //   this.splTokenProgramId,
          //   { limit: 5 }, // Fewer SPL signatures to reduce noise
          //   "confirmed",
          // ),
          Promise.resolve([]), // Return empty array for SPL Token real-time monitoring
        ]);

      const allSignatures = [
        ...goldSignatures,
        ...silverSignatures,
        ...splTokenSignatures,
      ];

      // Filter for new signatures since last processed slot
      const newSignatures = allSignatures.filter(
        (sig) => sig.slot && sig.slot > this.lastProcessedSlot,
      );

      if (newSignatures.length > 0) {
        console.log(
          "[SOLANA] 🔔 Found",
          newSignatures.length,
          "new signatures to process",
        );

        for (const sigInfo of newSignatures) {
          console.log(
            "[SOLANA] 🔔 Processing new signature:",
            sigInfo.signature,
          );
          await this.processRecentTransaction(
            sigInfo.signature,
            sigInfo.slot || currentSlot,
          );
        }

        // Update last processed slot
        this.lastProcessedSlot = Math.max(
          ...newSignatures.map((s) => s.slot || 0),
        );
        await this.saveLastProcessedState();
      }
    } catch (error) {
      console.error("[SOLANA] Error checking for new signatures:", error);
    }
  }

  /**
   * Process a new signature detected in real-time
   */
  private async processNewSignature(
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      console.log(
        "[SOLANA] 🔔 Processing real-time signature:",
        signature,
        "at slot:",
        slot,
      );
      await this.processRecentTransaction(signature, slot);

      // Update last processed slot
      if (slot > this.lastProcessedSlot) {
        this.lastProcessedSlot = slot;
        await this.saveLastProcessedState();
      }
    } catch (error) {
      console.error("[SOLANA] Error processing new signature:", error);
    }
  }

  /**
   * Setup account change listeners with better error handling
   */
  private async setupAccountChangeListeners(): Promise<void> {
    try {
      // Subscribe to program account changes for both Gold and Silver programs
      const goldProgramSubscriptionId = this.connection.onProgramAccountChange(
        this.goldProgramId,
        (keyedAccountInfo, context) => {
          this.handleProgramAccountChange(keyedAccountInfo, context);
        },
        "confirmed",
      );
      this.accountSubscriptionIds.push(goldProgramSubscriptionId);

      const silverProgramSubscriptionId =
        this.connection.onProgramAccountChange(
          this.silverProgramId,
          (keyedAccountInfo, context) => {
            this.handleProgramAccountChange(keyedAccountInfo, context);
          },
          "confirmed",
        );
      this.accountSubscriptionIds.push(silverProgramSubscriptionId);

      console.log(
        "[SOLANA] Program account change listener set up successfully",
      );
    } catch (error) {
      console.error(
        "[SOLANA] Failed to set up account change listeners:",
        error,
      );
      throw error;
    }
  }

  /**
   * Handle program account changes with enhanced event detection
   */
  private async handleProgramAccountChange(
    keyedAccountInfo: any,
    context: any,
  ): Promise<void> {
    try {
      console.log(
        "[SOLANA] 🔍 Program account change detected at slot:",
        context.slot,
      );
      console.log(
        "[SOLANA] Account ID:",
        keyedAccountInfo.accountId.toString(),
      );
      console.log(
        "[SOLANA] Account owner:",
        keyedAccountInfo.accountInfo.owner.toString(),
      );
      console.log(
        "[SOLANA] Account data length:",
        keyedAccountInfo.accountInfo.data?.length || 0,
      );

      // Check if this might be a transaction we need to fetch logs for
      const currentSlot = await this.connection.getSlot();
      if (context.slot && context.slot > (this.lastProcessedSlot || 0)) {
        console.log(
          "[SOLANA] 🔍 New slot detected, checking for recent transactions...",
        );

        // Get recent signatures for this slot range
        try {
          // Get signatures for both programs
          const [goldSignatures, silverSignatures] = await Promise.all([
            this.connection.getSignaturesForAddress(
              this.goldProgramId,
              { limit: 5 },
              "confirmed",
            ),
            this.connection.getSignaturesForAddress(
              this.silverProgramId,
              { limit: 5 },
              "confirmed",
            ),
          ]);
          const signatures = [...goldSignatures, ...silverSignatures];

          // Filter for signatures from recent slots
          const recentSignatures = signatures.filter(
            (sig) => sig.slot && sig.slot >= (this.lastProcessedSlot || 0),
          );

          console.log(
            "[SOLANA] Found",
            recentSignatures.length,
            "recent signatures to check",
          );

          for (const sig of recentSignatures.slice(0, 3)) {
            // Check only the most recent ones
            console.log("[SOLANA] 🔍 Checking signature:", sig.signature);
            await this.processRecentTransaction(
              sig.signature,
              sig.slot || context.slot,
            );
          }
        } catch (error) {
          console.log(
            "[SOLANA] Error fetching recent signatures:",
            error.message,
          );
        }
      }

      // Update last processed slot
      if (context.slot > this.lastProcessedSlot) {
        this.lastProcessedSlot = context.slot;
        await this.saveLastProcessedState();
      }
    } catch (error) {
      console.error("[SOLANA] Error processing program account change:", error);
    }
  }

  /**
   * Process a recent transaction to check for events
   */
  private async processRecentTransaction(
    signature: string,
    slot: number,
  ): Promise<void> {
    try {
      // Skip if already processed
      if (this.processedTransactions.has(signature)) {
        return;
      }

      console.log("[SOLANA] 🔍 Processing recent transaction:", signature);

      const transaction = await this.connection.getParsedTransaction(
        signature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        },
      );

      if (!transaction || transaction.meta?.err) {
        console.log("[SOLANA] Transaction failed or not found:", signature);
        return;
      }

      console.log("[SOLANA] ✓ Transaction found, processing events...");

      // Process events from logs with database integration
      if (transaction.meta?.logMessages) {
        const events = await this.parseEventsFromLogsWithReturn(
          transaction.meta.logMessages,
          signature,
          slot,
        );

        for (const event of events) {
          const result = await this.handleEventWithDbCheck(
            event,
            signature,
            slot,
          );
          console.log("[SOLANA] 🎉 Real-time event processed with DB result:", {
            eventName: event.name,
            action: result?.action,
            signature,
          });
        }
      }

      // Mark as processed
      this.processedTransactions.add(signature);
    } catch (error) {
      console.error("[SOLANA] Error processing recent transaction:", error);
    }
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[SOLANA] Max reconnection attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[SOLANA] Connection error. Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`,
    );

    setTimeout(async () => {
      try {
        this.stopListening();
        await this.startListening(false); // Don't process history on reconnect
      } catch (error) {
        console.error("[SOLANA] Reconnection failed:", error);
        await this.handleConnectionError();
      }
    }, this.reconnectDelay);
  }

  /**
   * Handle RedemptionRequested events from Solana (Enhanced)
   */
  private async handleRedemptionRequestedEvent(
    event: RedemptionRequestedEvent,
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      // Enhanced BN object extraction with proper decoding
      const userStr = event.user?.toString
        ? event.user.toString()
        : String(event.user || "unknown");

      // Handle BN objects properly for numeric fields
      let amountStr = "0";
      let requestIdStr = "0";
      let timestampStr = String(Date.now() / 1000);

      // Decode amount from BN object
      if (event.amount) {
        if (typeof event.amount === "object" && event.amount._hex) {
          amountStr = event.amount.toString();
        } else if (event.amount.toString) {
          amountStr = event.amount.toString();
        } else {
          amountStr = String(event.amount);
        }
      }

      // Decode requestId from BN object - this is the critical fix
      if (event.request_id) {
        const requestIdBN = event.request_id;
        console.log("[SOLANA] 🔍 Decoding requestId BN object:", {
          type: typeof requestIdBN,
          constructor: requestIdBN?.constructor?.name,
          hasToString: typeof requestIdBN?.toString === "function",
          bnValue: requestIdBN,
        });

        if (typeof requestIdBN === "object" && (requestIdBN as any)._hex) {
          requestIdStr = requestIdBN.toString();
          console.log("[SOLANA] ✓ Decoded requestId from _hex:", requestIdStr);
        } else if (requestIdBN.toString) {
          requestIdStr = requestIdBN.toString();
          console.log(
            "[SOLANA] ✓ Decoded requestId from toString():",
            requestIdStr,
          );
        } else {
          requestIdStr = String(requestIdBN);
          console.log(
            "[SOLANA] ✓ Decoded requestId from String():",
            requestIdStr,
          );
        }
      } else {
        console.log(
          "[SOLANA] ⚠️ No requestId found in event data, keys:",
          Object.keys(event || {}),
        );
      }

      // Decode timestamp from BN object
      if (event.timestamp) {
        if (
          typeof event.timestamp === "object" &&
          (event.timestamp as any)._hex
        ) {
          timestampStr = event.timestamp.toString();
        } else if (event.timestamp.toString) {
          timestampStr = event.timestamp.toString();
        } else {
          timestampStr = String(event.timestamp);
        }
      }

      console.log("[SOLANA] 🎉 REAL-TIME RedemptionRequested Event Detected:", {
        user: userStr,
        amount: amountStr,
        requestId: requestIdStr,
        timestamp: timestampStr,
        slot,
        signature,
        eventDataKeys: Object.keys(event || {}),
        rawEvent: event,
      });

      // Check for duplicate processing
      const eventKey = `redemption_requested_${requestIdStr}_${userStr}`;
      if (this.processedTransactions.has(eventKey)) {
        console.log("[SOLANA] Event already processed, skipping:", eventKey);
        return;
      }

      // **FIXED**: Check if there's an existing redemption record to update with this event data
      console.log(
        "[SOLANA] 🔍 Checking for existing redemption record to update with signature:",
        signature,
      );

      if (signature) {
        // **RACE CONDITION FIX**: Wait initial 500ms for frontend record creation, then retry mechanism
        console.log(
          "[SOLANA] ⏳ REAL-TIME: Initial wait of 500ms for frontend record creation...",
        );
        await new Promise((resolve) => setTimeout(resolve, 500));

        let existingRedemption = null;
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 500; // 500ms delay between retries as requested

        while (retryCount < maxRetries && !existingRedemption) {
          existingRedemption =
            await storage.getRedemptionByTransactionHash(signature);

          if (!existingRedemption) {
            console.log(
              `[SOLANA] ⏳ REAL-TIME: Redemption record not found (attempt ${retryCount + 1}/${maxRetries}), waiting for frontend creation...`,
            );
            console.log(
              `[SOLANA] 🔍 REAL-TIME: Searching for signature: ${signature}`,
            );

            if (retryCount < maxRetries - 1) {
              // Wait before next retry with longer delay
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
          } else {
            console.log(
              `[SOLANA] ✅ REAL-TIME: Found redemption record on attempt ${retryCount + 1}`,
            );
          }

          retryCount++;
        }

        console.log(
          "[SOLANA] 📋 REAL-TIME: Final result after initial wait + ",
          retryCount,
          "retry attempts:",
          existingRedemption ? "FOUND" : "NOT_FOUND",
        );

        if (existingRedemption) {
          console.log("[SOLANA] ✅ Found existing redemption to update:", {
            id: existingRedemption._id,
            currentRequestId: existingRedemption.requestId,
            newRequestId: requestIdStr,
          });

          // Update the existing record with blockchain event data
          await storage.updateRedemption(existingRedemption._id!.toString(), {
            requestId: requestIdStr,
            updatedAt: new Date(),
          });

          console.log(
            "[SOLANA] ✅ REAL-TIME UPDATE SUCCESS - Updated redemption with event data",
          );

          // Send email notification
          await BlockchainEmailService.sendBlockchainEventNotification({
            eventType: "REQUEST_REDEMPTION",
            network: "Solana",
            walletAddress: userStr,
            transactionHash: signature || "",
            tokenType: "GOLD", // TODO: Determine dynamically
            amount: amountStr,
            requestId: requestIdStr,
            slot,
          });

          return;
        }
      }

      // If no existing redemption found, log this for debugging but don't create new record
      console.log(
        "[SOLANA] ℹ️ No existing redemption found for real-time event:",
        {
          signature,
          walletAddress: userStr,
          requestId: requestIdStr,
          note: "Blockchain events should update existing redemption records, not create new ones",
        },
      );
      return;
    } catch (error) {
      console.error(
        "[SOLANA] Error processing RedemptionRequested event:",
        error,
      );
    }
  }

  /**
   * Handle RedemptionCancelled events from Solana (Enhanced)
   */
  private async handleRedemptionCancelledEvent(
    event: RedemptionCancelledEvent,
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      console.log("[SOLANA] 🔍 Processing RedemptionCancelled event:", {
        user: event.user.toString(),
        requestId: event.request_id.toString(),
        amount: event.amount.toString(),
        slot,
        signature,
      });

      // Check for duplicate processing
      const eventKey = `redemption_cancelled_${event.request_id.toString()}_${event.user.toString()}`;
      if (this.processedTransactions.has(eventKey)) {
        console.log("[SOLANA] Event already processed, skipping:", eventKey);
        return;
      }

      // Find and update the redemption record - use available storage methods
      const redemptionToCancel =
        await storage.getRedemptionByTransactionHash(""); // Placeholder for now
      console.log(
        "[SOLANA] ⚠️ Storage method compatibility - skipping actual redemption lookup",
      );

      if (redemptionToCancel) {
        await storage.updateRedemption(
          redemptionToCancel._id?.toString() || "",
          {
            status: "cancelled",
            updatedAt: new Date(),
            transactionHash: signature, // Using existing field instead of cancellationTransactionHash
          },
        );

        console.log("[SOLANA] ✓ Redemption cancelled:", {
          redemptionId: redemptionToCancel._id,
          requestId: event.request_id.toString(),
          user: event.user.toString(),
        });
      } else {
        console.log(
          "[SOLANA] ⚠️ No matching redemption found for cancellation:",
          {
            requestId: event.request_id.toString(),
            user: event.user.toString(),
          },
        );
      }

      // Mark as processed
      this.processedTransactions.add(eventKey);
      if (signature) {
        this.processedTransactions.add(signature);
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error processing RedemptionCancelled event:",
        error,
      );
    }
  }

  /**
   * Handle RedemptionFulfilled events from Solana (Enhanced)
   */
  private async handleRedemptionFulfilledEvent(
    event: RedemptionFulfilledEvent,
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      console.log("[SOLANA] 🔍 Processing RedemptionFulfilled event:", {
        user: event.user.toString(),
        requestId: event.request_id.toString(),
        amount: event.amount.toString(),
        slot,
        signature,
      });

      // Check for duplicate processing
      const eventKey = `redemption_fulfilled_${event.request_id.toString()}_${event.user.toString()}`;
      if (this.processedTransactions.has(eventKey)) {
        console.log("[SOLANA] Event already processed, skipping:", eventKey);
        return;
      }

      // Find and update the redemption record - use available storage methods
      const redemptionToFulfill =
        await storage.getRedemptionByTransactionHash(""); // Placeholder for now
      console.log(
        "[SOLANA] ⚠️ Storage method compatibility - skipping actual redemption lookup",
      );

      if (redemptionToFulfill) {
        await storage.updateRedemption(
          redemptionToFulfill._id?.toString() || "",
          {
            status: "completed",
            updatedAt: new Date(),
            transactionHash: signature, // Using existing field instead of fulfillmentTransactionHash
            completedAt: new Date(),
          },
        );

        console.log("[SOLANA] ✓ Redemption fulfilled:", {
          redemptionId: redemptionToFulfill._id,
          requestId: event.request_id.toString(),
          user: event.user.toString(),
        });
      } else {
        console.log(
          "[SOLANA] ⚠️ No matching redemption found for fulfillment:",
          {
            requestId: event.request_id.toString(),
            user: event.user.toString(),
          },
        );
      }

      // Mark as processed
      this.processedTransactions.add(eventKey);
      if (signature) {
        this.processedTransactions.add(signature);
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error processing RedemptionFulfilled event:",
        error,
      );
    }
  }

  /**
   * Handle Mint events from Solana
   */
  private async handleMintEvent(
    event: MintEvent,
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      const userStr = event.user?.toString
        ? event.user.toString()
        : String(event.user || "unknown");
      const amountStr = event.amount?.toString
        ? event.amount.toString()
        : String(event.amount || "0");
      const requestIdStr = event.request_id?.toString
        ? event.request_id.toString()
        : "N/A";

      console.log("[SOLANA] 🎉 MINT Event Detected:", {
        user: userStr,
        amount: amountStr,
        requestId: requestIdStr,
        slot,
        signature,
      });

      // Mark as processed
      const eventKey = `mint_${userStr}_${slot}_${signature}`;
      this.processedTransactions.add(eventKey);
      if (signature) {
        this.processedTransactions.add(signature);
      }
    } catch (error) {
      console.error("[SOLANA] Error processing Mint event:", error);
    }
  }

  /**
   * Handle FulfillRedemption events from Solana
   */
  private async handleFulfillRedemptionEvent(
    event: FulfillRedemptionEvent,
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      const userStr = event.user?.toString
        ? event.user.toString()
        : String(event.user || "unknown");
      const amountStr = event.amount?.toString
        ? event.amount.toString()
        : String(event.amount || "0");
      const requestIdStr = event.request_id?.toString
        ? event.request_id.toString()
        : "N/A";

      console.log("[SOLANA] 🎉 FULFILL_REDEMPTION Event Detected:", {
        user: userStr,
        amount: amountStr,
        requestId: requestIdStr,
        slot,
        signature,
      });

      // Update redemption status in database
      console.log(
        "[SOLANA] ⏳ Initial wait of 500ms for redemption record lookup...",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      let attempts = 0;
      let redemptionRecord = null;
      const maxAttempts = 5;

      while (attempts < maxAttempts && !redemptionRecord) {
        attempts++;
        redemptionRecord = await storage.getRedemptionByRequestId(requestIdStr);

        if (!redemptionRecord && attempts < maxAttempts) {
          console.log(
            `[SOLANA] 🔄 Attempt ${attempts}: Redemption not found, waiting 1s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (redemptionRecord && redemptionRecord._id) {
        console.log(
          `[SOLANA] ✅ Found redemption record on attempt ${attempts}`,
        );

        // Check if fulfilled notification has already been sent
        const alreadyFulfilledNotified =
          redemptionRecord.notificationStatus?.fulfilledNotified || false;

        // Update redemption status to completed and mark fulfilled notification as sent
        await storage.updateRedemption(redemptionRecord._id.toString(), {
          status: "completed" as any,
          updatedAt: new Date(),
          completedAt: new Date(),
          transactionHash: signature || "",
          notificationStatus: {
            requestNotified:
              redemptionRecord.notificationStatus?.requestNotified || false,
            processingNotified:
              redemptionRecord.notificationStatus?.processingNotified || false,
            fulfilledNotified: true,
            cancelledNotified:
              redemptionRecord.notificationStatus?.cancelledNotified || false,
          },
        });

        console.log("[SOLANA] ✅ Database updated to completed:", {
          redemptionId: redemptionRecord._id,
          newStatus: "completed",
          transactionHash: signature,
          completedAt: new Date(),
          fulfilledNotified: true,
        });

        // Send email notification only if not already sent
        if (!alreadyFulfilledNotified) {
          try {
            const tokenType =
              redemptionRecord.token?.toUpperCase() || "UNKNOWN";
            await BlockchainEmailService.sendBlockchainEventNotification({
              eventType: "REDEMPTION_FULFILLED",
              network: "Solana",
              walletAddress: userStr,
              transactionHash: signature || "",
              tokenType,
              amount: (redemptionRecord.quantity || "0").toString(),
              requestId: requestIdStr,
            });
            console.log(
              "[SOLANA] ✅ FulfillRedemption email notification sent successfully with fulfilledNotified tracking",
            );
          } catch (emailError: any) {
            console.log(
              "[SOLANA] ⚠️ FulfillRedemption email notification failed:",
              emailError?.message || "Unknown error",
            );
            // Reset the notification flag on email failure
            await storage.updateRedemption(redemptionRecord._id.toString(), {
              notificationStatus: {
                requestNotified:
                  redemptionRecord.notificationStatus?.requestNotified || false,
                processingNotified:
                  redemptionRecord.notificationStatus?.processingNotified ||
                  false,
                fulfilledNotified: false,
                cancelledNotified:
                  redemptionRecord.notificationStatus?.cancelledNotified ||
                  false,
              },
            });
          }
        } else {
          console.log(
            "[SOLANA] ℹ️ FulfillRedemption email notification already sent, skipping duplicate",
          );
        }
      } else {
        console.log(
          `[SOLANA] ❌ No redemption record found for requestId ${requestIdStr} after ${maxAttempts} attempts`,
        );
      }

      // Mark as processed
      const eventKey = `fulfill_redemption_${requestIdStr}_${userStr}`;
      this.processedTransactions.add(eventKey);
      if (signature) {
        this.processedTransactions.add(signature);
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error processing FulfillRedemption event:",
        error,
      );
    }
  }

  /**
   * Handle MintTokens events from Solana
   */
  private async handleMintTokensEvent(
    event: MintTokensEvent,
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      const userStr = event.user?.toString
        ? event.user.toString()
        : String(event.user || "unknown");
      const amountStr = event.amount?.toString
        ? event.amount.toString()
        : String(event.amount || "0");
      const requestIdStr = event.request_id?.toString
        ? event.request_id.toString()
        : "N/A";

      console.log("[SOLANA] 🎉 MINT_TOKENS Event Detected:", {
        user: userStr,
        amount: amountStr,
        requestId: requestIdStr,
        slot,
        signature,
      });

      // Check if we have a signature to process
      if (signature) {
        // Determine token type based on the program that emitted the event
        const tokenType = await this.determineTokenType(event.user);

        const purchaseRecord =
          await storage.getPurchaseHistoryByTransactionHash(signature);

        if (purchaseRecord) {
          await storage.updatePurchaseHistory(purchaseRecord._id!, {
            status: "completed",
          });

          if (purchaseRecord && purchaseRecord.notified) {
            Logger.info(
              `📧 Notification already sent for ${purchaseRecord?.metal} mint:`,
              {
                transactionHash: signature,
                notified: purchaseRecord.notified,
              },
            );
            return;
          }

          // Send notification
          await BlockchainEmailService.sendBlockchainEventNotification({
            eventType: "MINT",
            network: "Solana",
            walletAddress: purchaseRecord?.walletAddress,
            transactionHash: signature,
            tokenType: purchaseRecord?.metal.toUpperCase(),
            amount: amountStr,
            blockNumber: slot,
          });

          // Mark as notified if purchase record exists
          if (purchaseRecord) {
            await storage.updatePurchaseHistory(purchaseRecord._id!, {
              notified: true,
            });
          }

          Logger.info(
            `📧 Mint notification sent and marked as notified for ${purchaseRecord?.metal.toUpperCase()}:`,
            {
              purchaseId: purchaseRecord._id,
              transactionHash: signature,
            },
          );
        }
      }

      // Mark as processed
      const eventKey = `mint_tokens_${userStr}_${slot}_${signature}`;
      this.processedTransactions.add(eventKey);
      if (signature) {
        this.processedTransactions.add(signature);
      }
    } catch (error) {
      console.error("[SOLANA] Error processing MintTokens event:", error);
    }
  }

  /**
   * Handle SetRedemptionProcessing events from Solana
   */
  private async handleSetRedemptionProcessingEvent(
    event: SetRedemptionProcessingEvent,
    slot: number,
    signature?: string,
  ): Promise<void> {
    try {
      const userStr = event.user?.toString
        ? event.user.toString()
        : String(event.user || "unknown");
      const requestIdStr = event.request_id?.toString
        ? event.request_id.toString()
        : "N/A";
      const statusStr = event.status || "processing";

      console.log("[SOLANA] 🎉 SET_REDEMPTION_PROCESSING Event Detected:", {
        user: userStr,
        requestId: requestIdStr,
        status: statusStr,
        slot,
        signature,
      });

      // Update redemption status in database
      console.log(
        "[SOLANA] ⏳ Initial wait of 500ms for frontend redemption record creation...",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      let attempts = 0;
      let redemptionRecord = null;
      const maxAttempts = 5;

      while (attempts < maxAttempts && !redemptionRecord) {
        attempts++;
        redemptionRecord = await storage.getRedemptionByRequestId(requestIdStr);

        if (!redemptionRecord && attempts < maxAttempts) {
          console.log(
            `[SOLANA] 🔄 Attempt ${attempts}: Redemption not found, waiting 1s...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (redemptionRecord && redemptionRecord._id) {
        console.log(
          `[SOLANA] ✅ Found redemption record on attempt ${attempts}`,
        );

        // Check if processing notification has already been sent
        const alreadyProcessingNotified =
          redemptionRecord.notificationStatus?.processingNotified || false;

        // Update redemption status to processing and mark processing notification as sent
        await storage.updateRedemption(redemptionRecord._id.toString(), {
          status: "processing" as any,
          updatedAt: new Date(),
          transactionHash: signature || "",
          notificationStatus: {
            requestNotified:
              redemptionRecord.notificationStatus?.requestNotified || false,
            processingNotified: true,
            fulfilledNotified:
              redemptionRecord.notificationStatus?.fulfilledNotified || false,
            cancelledNotified:
              redemptionRecord.notificationStatus?.cancelledNotified || false,
          },
        });

        console.log("[SOLANA] ✅ Database updated to processing:", {
          redemptionId: redemptionRecord._id,
          newStatus: "processing",
          transactionHash: signature,
          processingNotified: true,
        });

        // Send email notification only if not already sent
        if (!alreadyProcessingNotified) {
          try {
            const tokenType =
              redemptionRecord.token?.toUpperCase() || "UNKNOWN";
            await BlockchainEmailService.sendBlockchainEventNotification({
              eventType: "REDEMPTION_PROCESSING",
              network: "Solana",
              walletAddress: userStr,
              transactionHash: signature || "",
              tokenType,
              amount: (redemptionRecord.quantity || "0").toString(),
              requestId: requestIdStr,
            });
            console.log(
              "[SOLANA] ✅ SetRedemptionProcessing email notification sent successfully with processingNotified tracking",
            );
          } catch (emailError: any) {
            console.log(
              "[SOLANA] ⚠️ SetRedemptionProcessing email notification failed:",
              emailError?.message || "Unknown error",
            );
            // Reset the notification flag on email failure
            await storage.updateRedemption(redemptionRecord._id.toString(), {
              notificationStatus: {
                requestNotified:
                  redemptionRecord.notificationStatus?.requestNotified || false,
                processingNotified: false,
                fulfilledNotified:
                  redemptionRecord.notificationStatus?.fulfilledNotified ||
                  false,
                cancelledNotified:
                  redemptionRecord.notificationStatus?.cancelledNotified ||
                  false,
              },
            });
          }
        } else {
          console.log(
            "[SOLANA] ℹ️ SetRedemptionProcessing email notification already sent, skipping duplicate",
          );
        }
      } else {
        console.log(
          `[SOLANA] ❌ No redemption record found for requestId ${requestIdStr} after ${maxAttempts} attempts`,
        );
      }

      // Mark as processed
      const eventKey = `set_redemption_processing_${requestIdStr}_${userStr}`;
      this.processedTransactions.add(eventKey);
      if (signature) {
        this.processedTransactions.add(signature);
      }
    } catch (error) {
      console.error(
        "[SOLANA] Error processing SetRedemptionProcessing event:",
        error,
      );
    }
  }

  /**
   * Determine token type based on mint address
   */
  private async determineTokenType(
    userAddress: PublicKey,
    mintAddress?: PublicKey,
  ): Promise<"GOLD" | "SILVER"> {
    try {
      if (mintAddress) {
        // Compare with known mint addresses
        if (mintAddress.toString() === this.goldTokenMint.toString()) {
          return "GOLD";
        } else if (mintAddress.toString() === this.silverTokenMint.toString()) {
          return "SILVER";
        }
      }

      // Fallback: try to determine from user's token accounts
      try {
        const tokenAccounts =
          await this.connection.getParsedTokenAccountsByOwner(
            userAddress,
            {
              programId: new PublicKey(
                "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
              ),
            }, // SPL Token Program
          );

        for (const account of tokenAccounts.value) {
          const mintAddress = account.account.data.parsed.info.mint;

          if (mintAddress === this.goldTokenMint.toString()) {
            return "GOLD";
          } else if (mintAddress === this.silverTokenMint.toString()) {
            return "SILVER";
          }
        }
      } catch (error) {
        console.error("[SOLANA] Error fetching token accounts:", error);
      }

      // Default fallback
      console.log(
        "[SOLANA] Could not determine token type, defaulting to GOLD",
      );
      return "GOLD";
    } catch (error) {
      console.error("[SOLANA] Error determining token type:", error);
      return "GOLD";
    }
  }

  /**
   * Stop listening for events (Enhanced)
   */
  stopListening(): void {
    try {
      // Remove event listeners
      if (this.eventListenerIds.length > 0) {
        this.eventListenerIds.forEach((id) => {
          try {
            if (typeof id === "number") {
              clearInterval(id);
            }
          } catch (error) {
            console.error("[SOLANA] Error removing event listener:", id, error);
          }
        });
        this.eventListenerIds = [];
      }

      // Remove account subscriptions
      if (this.accountSubscriptionIds.length > 0) {
        this.accountSubscriptionIds.forEach((id) => {
          try {
            this.connection.removeAccountChangeListener(id);
          } catch (error) {
            console.error(
              "[SOLANA] Error removing account change listener:",
              id,
              error,
            );
          }
        });
        this.accountSubscriptionIds = [];
      }

      this.isListening = false;
      console.log("[SOLANA] Stopped listening for Solana blockchain events");
    } catch (error) {
      console.error("[SOLANA] Error stopping listeners:", error);
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.isListening;
  }

  /**
   * Get listener statistics
   */
  getStats(): object {
    return {
      isListening: this.isListening,
      isProcessingHistory: this.isProcessingHistory,
      lastProcessedSlot: this.lastProcessedSlot,
      processedTransactionsCount: this.processedTransactions.size,
      eventListenersCount: this.eventListenerIds.length,
      accountSubscriptionsCount: this.accountSubscriptionIds.length,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Manual transaction processing for debugging (Enhanced)
   */
  async processTransactionManually(signature: string): Promise<void> {
    try {
      console.log("[SOLANA] 🔧 Manual processing of transaction:", signature);

      const transaction = await this.connection.getParsedTransaction(
        signature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        },
      );

      if (!transaction) {
        console.log("[SOLANA] ❌ Transaction not found:", signature);
        return;
      }

      if (transaction.meta?.err) {
        console.log(
          "[SOLANA] ❌ Transaction failed:",
          signature,
          transaction.meta.err,
        );
        return;
      }

      // Parse events from transaction logs
      if (this.program && transaction.meta?.logMessages) {
        await this.parseEventsFromLogs(
          transaction.meta.logMessages,
          signature,
          transaction.slot || 0,
        );
      }

      console.log("[SOLANA] ✓ Manual transaction processing completed");
    } catch (error) {
      console.error("[SOLANA] Error in manual transaction processing:", error);
    }
  }

  /**
   * Enhanced method to get redemption request details from PDA
   */
  private async getRedemptionRequestDetails(
    userPubkey: PublicKey,
    requestId: InstanceType<typeof BN>,
  ): Promise<any> {
    try {
      // Derive PDA for redemption_request based on your IDL seeds
      const [redemptionRequestPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("redemption_request"),
          userPubkey.toBuffer(),
          requestId.toArrayLike(Buffer, "le", 8),
        ],
        this.goldProgramId,
      );

      const accountInfo =
        await this.connection.getAccountInfo(redemptionRequestPDA);

      if (accountInfo) {
        // You would need to implement the actual deserialization based on your account structure
        // This is a placeholder for the account data structure
        return {
          user: userPubkey,
          amount: new BN(0), // Parse from account data
          requestId: requestId,
          status: "pending", // Parse from account data
          mint: null, // Parse from account data
        };
      }

      return null;
    } catch (error) {
      console.error(
        "[SOLANA] Error getting redemption request details:",
        error,
      );
      return null;
    }
  }

  /**
   * Monitor for account closures (when redemption is completed/cancelled)
   */
  private async monitorAccountClosures(): Promise<void> {
    try {
      // Subscribe to both programs for account closure monitoring
      const goldSubscription = this.connection.onProgramAccountChange(
        this.goldProgramId,
        (keyedAccountInfo, context) => {
          // Handle account changes, including closures
          if (
            !keyedAccountInfo.accountInfo.data ||
            keyedAccountInfo.accountInfo.data.length === 0
          ) {
            console.log(
              "[SOLANA] Account closed:",
              keyedAccountInfo.accountId.toString(),
            );
            // This might indicate a redemption was completed or cancelled
            this.handleAccountClosure(keyedAccountInfo.accountId, context.slot);
          }
        },
        "confirmed",
      );

      this.accountSubscriptionIds.push(goldSubscription);

      const silverSubscription = this.connection.onProgramAccountChange(
        this.silverProgramId,
        (keyedAccountInfo, context) => {
          if (
            !keyedAccountInfo.accountInfo.data ||
            keyedAccountInfo.accountInfo.data.length === 0
          ) {
            console.log(
              "[SOLANA] Silver account closed:",
              keyedAccountInfo.accountId.toString(),
            );
            this.handleAccountClosure(keyedAccountInfo.accountId, context.slot);
          }
        },
        "confirmed",
      );

      this.accountSubscriptionIds.push(silverSubscription);
    } catch (error) {
      console.error(
        "[SOLANA] Error setting up account closure monitoring:",
        error,
      );
    }
  }

  /**
   * Handle account closure events
   */
  private async handleAccountClosure(
    accountId: PublicKey,
    slot: number,
  ): Promise<void> {
    try {
      // Check if this was a redemption_request account
      // You could maintain a map of active redemption request PDAs
      console.log(
        "[SOLANA] Handling potential redemption account closure:",
        accountId.toString(),
      );

      // This would require more sophisticated tracking of active redemption requests
      // For now, just log the event
    } catch (error) {
      console.error("[SOLANA] Error handling account closure:", error);
    }
  }

  /**
   * Validate and enrich redemption data
   */
  private async validateAndEnrichRedemptionData(
    eventData: any,
    signature?: string,
  ): Promise<any> {
    try {
      // Add validation logic
      if (!eventData.user || !eventData.amount || !eventData.requestId) {
        throw new Error("Missing required redemption data fields");
      }

      // Enrich with additional data
      const enrichedData = {
        ...eventData,
        transactionHash: signature || "",
        networkFee: await this.getTransactionFee(signature),
        blockConfirmations: signature
          ? await this.getConfirmations(signature)
          : 0,
        validatedAt: new Date(),
      };

      return enrichedData;
    } catch (error) {
      console.error(
        "[SOLANA] Error validating/enriching redemption data:",
        error,
      );
      return eventData;
    }
  }

  /**
   * Get transaction fee
   */
  private async getTransactionFee(signature?: string): Promise<number> {
    if (!signature) return 0;

    try {
      const transaction = await this.connection.getTransaction(signature);
      return transaction?.meta?.fee || 0;
    } catch (error) {
      console.error("[SOLANA] Error getting transaction fee:", error);
      return 0;
    }
  }

  /**
   * Get confirmation count
   */
  private async getConfirmations(signature: string): Promise<number> {
    try {
      const currentSlot = await this.connection.getSlot();
      const transaction = await this.connection.getTransaction(signature);

      if (transaction?.slot) {
        return Math.max(0, currentSlot - transaction.slot);
      }

      return 0;
    } catch (error) {
      console.error("[SOLANA] Error getting confirmations:", error);
      return 0;
    }
  }

  /**
   * Process a specific missed transaction for debugging
   */
  async processMissedTransaction(signature: string): Promise<void> {
    try {
      console.log(`[SOLANA] 🔍 Processing missed transaction: ${signature}`);

      const transaction = await this.connection.getParsedTransaction(
        signature,
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        },
      );

      if (!transaction || transaction.meta?.err) {
        console.log("[SOLANA] ❌ Transaction not found or failed:", signature);
        return;
      }

      console.log("[SOLANA] ✓ Transaction found, processing logs...");

      // Extract and process logs
      const logs = transaction.meta?.logMessages || [];
      await this.parseEventsFromLogs(logs, signature, transaction.slot || 0);
    } catch (error) {
      console.error("[SOLANA] Error processing missed transaction:", error);
    }
  }

  /**
   * Handle RedemptionRequested event with database check - similar to Ethereum flow
   */
  private async handleRedemptionRequestedEventWithDbCheck(
    event: any,
    slot: number,
    signature?: string,
  ): Promise<{ action: "created" | "updated" | "skipped" }> {
    try {
      // Safe property extraction with fallbacks
      const userStr = event.user?.toString
        ? event.user.toString()
        : String(event.user || "unknown");
      const amountStr = event.amount?.toString
        ? event.amount.toString()
        : String(event.amount || "0");
      let requestIdStr = event.request_id?.toString
        ? event.request_id.toString()
        : String(event.request_id || "0");
      const timestampStr = event.timestamp?.toString
        ? event.timestamp.toString()
        : String(event.timestamp || Date.now() / 1000);

      // **CRITICAL FIX**: Handle both requestId fields (camelCase and snake_case)
      // The manual parsing provides requestId while the database expects request_id
      if ((requestIdStr === "0" || !requestIdStr) && event.requestId) {
        console.log(
          "[SOLANA] 🔧 CRITICAL requestId mapping fix from camelCase to snake_case",
        );
        requestIdStr = event.requestId.toString();
        console.log("[SOLANA] ✅ Fixed requestId mapping:", requestIdStr);
      }

      console.log(
        "[SOLANA] 🔍 Processing RedemptionRequested event for DB check:",
        {
          user: userStr,
          amount: amountStr,
          requestId: requestIdStr,
          timestamp: timestampStr,
          signature,
          fixedFromZero:
            requestIdStr !== "0" ? "YES - Fixed from zero" : "NO - Still zero",
        },
      );

      // Check if redemption record already exists with transaction hash
      const existingRedemption = await storage.getRedemptionByTransactionHash(
        signature || "",
      );
      console.log("[SOLANA] 🔍 Database search results:", existingRedemption);

      if (existingRedemption) {
        // If record exists but lacks requestId, update it (similar to Ethereum flow)
        if (
          !existingRedemption.requestId ||
          existingRedemption.requestId === "" ||
          existingRedemption.requestId === "null"
        ) {
          console.log(
            "[SOLANA] Found existing redemption without requestId - updating with requestId:",
            requestIdStr,
          );

          // Use updateRedemption with the redemption ID instead of updateRedemptionByTransactionHash
          await storage.updateRedemption(
            existingRedemption._id?.toString() || "",
            {
              requestId: requestIdStr,
              status: "pending",
            },
          );

          console.log(
            "[SOLANA] ✓ Updated existing redemption with requestId:",
            requestIdStr,
          );
          return { action: "updated" };
        } else {
          console.log(
            "[SOLANA] Redemption record already exists with requestId",
            existingRedemption.requestId,
          );
          return { action: "skipped" };
        }
      }

      // Create new redemption record from blockchain event
      const tokenType = "GOLD"; // Determine this based on your program logic
      const tokenAmount = (Number(amountStr) / 1e9).toFixed(9);

      // **CRITICAL FIX**: Look up actual user by wallet address before creating redemption
      console.log(
        "[SOLANA] 🔍 Looking up user by wallet address for new redemption:",
        userStr,
      );
      const userInfo = await storage.getUserIdByWalletAddress(userStr);

      if (!userInfo) {
        console.log(
          "[SOLANA] ⚠️ No user found for wallet address:",
          userStr,
          "Skipping redemption creation",
        );
        return { action: "skipped" };
      }

      console.log("[SOLANA] ✅ Found user for new redemption:", {
        userId: userInfo,
        walletAddress: userStr,
      });

      const redemptionData = {
        userId: userInfo, // Use actual user ID from wallet lookup (will be converted to ObjectId in storage layer)
        token: tokenType.toLowerCase() as any,
        quantity: tokenAmount,
        network: "solana" as const,
        walletAddress: userStr,
        transactionHash: signature || "",
        requestId: requestIdStr,
        deliveryAddress: "",
        status: "pending" as const,
        createdAt: new Date(Number(timestampStr) * 1000),
        updatedAt: new Date(),
        blockSlot: slot,
        eventProcessedAt: new Date(),
        solanaUserAddress: userStr,
      };

      await storage.createRedemption(redemptionData);

      console.log(
        "[SOLANA] ✓ Created new redemption record from event with proper user association:",
        {
          requestId: requestIdStr,
          userId: userInfo,
          walletAddress: userStr,
          amount: tokenAmount,
          transactionHash: signature,
        },
      );

      return { action: "created" };
    } catch (error) {
      console.error(
        "[SOLANA] Error processing RedemptionRequested event with DB check:",
        error,
      );
      return { action: "skipped" };
    }
  }

  /**
   * Handle RedemptionCancelled event with database check
   */
  private async handleRedemptionCancelledEventWithDbCheck(
    event: any,
    slot: number,
    signature?: string,
  ): Promise<{ action: "created" | "updated" | "skipped" }> {
    try {
      const userStr = event.user?.toString
        ? event.user.toString()
        : String(event.user || "unknown");
      let requestIdStr = event.request_id?.toString
        ? event.request_id.toString()
        : String(event.request_id || "0");

      // **CRITICAL FIX**: Handle both requestId fields (camelCase and snake_case) - same as RedemptionRequested
      // The manual parsing provides requestId while the database check expects request_id
      if ((requestIdStr === "0" || !requestIdStr) && event.requestId) {
        console.log(
          "[SOLANA] 🔧 CRITICAL requestId mapping fix for CancelRedemption from camelCase to snake_case",
        );
        requestIdStr = event.requestId.toString();
        console.log(
          "[SOLANA] ✅ Fixed requestId mapping for CancelRedemption:",
          requestIdStr,
        );
      }

      console.log(
        "[SOLANA] 🔍 Processing RedemptionCancelled event for DB check:",
        {
          user: userStr,
          requestId: requestIdStr,
          signature,
          fixedFromZero:
            requestIdStr !== "0" ? "YES - Fixed from zero" : "NO - Still zero",
        },
      );

      // Find the existing redemption by requestId and update status to cancelled
      console.log(
        "[SOLANA] 🔍 Searching for existing redemption to cancel with requestId:",
        requestIdStr,
      );
      // Simplified approach: Use direct database check by requestId (skip bulk retrieval)
      console.log(
        "[SOLANA] 🔍 Simplified approach - checking for specific redemption by requestId",
      );
      let existingRedemption = null;

      try {
        // Try to find the specific redemption using available methods
        // Since CancelRedemption should match an existing RedemptionRequested,
        // we can search by the requestId directly in the database collections

        console.log(
          "[SOLANA] 🔍 Attempting to find redemption with requestId:",
          requestIdStr,
        );

        // Find the redemption record to cancel by requestId
        existingRedemption =
          await storage.getRedemptionByRequestId(requestIdStr);

        if (existingRedemption && existingRedemption._id) {
          console.log("[SOLANA] ✅ Found redemption record to cancel:", {
            redemptionId: existingRedemption._id,
            currentStatus: existingRedemption.status,
            requestId: requestIdStr,
            network: existingRedemption.network,
          });

          // Check if cancellation notification has already been sent
          const alreadyCancelledNotified =
            existingRedemption.notificationStatus?.cancelledNotified || false;

          // Update redemption status to cancelled and mark cancellation notification as sent
          await storage.updateRedemption(existingRedemption._id.toString(), {
            status: "cancelled" as any,
            updatedAt: new Date(),
            transactionHash: signature || "",
            notificationStatus: {
              requestNotified:
                existingRedemption.notificationStatus?.requestNotified || false,
              processingNotified:
                existingRedemption.notificationStatus?.processingNotified ||
                false,
              fulfilledNotified:
                existingRedemption.notificationStatus?.fulfilledNotified ||
                false,
              cancelledNotified: true,
            },
          });

          console.log("[SOLANA] ✅ Database updated to cancelled:", {
            redemptionId: existingRedemption._id,
            newStatus: "cancelled",
            transactionHash: signature,
            cancelledNotified: true,
          });

          // Send email notification for cancellation only if not already sent
          if (!alreadyCancelledNotified) {
            try {
              const tokenType =
                existingRedemption.token?.toUpperCase() || "UNKNOWN";
              await BlockchainEmailService.sendBlockchainEventNotification({
                eventType: "REDEMPTION_CANCEL",
                network: "Solana",
                walletAddress: userStr,
                transactionHash: signature || "",
                tokenType,
                amount: (existingRedemption.quantity || "0").toString(),
                requestId: requestIdStr,
              });
              console.log(
                "[SOLANA] ✅ RedemptionCancelled email notification sent successfully with cancelledNotified tracking",
              );
            } catch (emailError: any) {
              console.log(
                "[SOLANA] ⚠️ RedemptionCancelled email notification failed:",
                emailError?.message || "Unknown error",
              );
              // Reset the notification flag on email failure
              await storage.updateRedemption(
                existingRedemption._id.toString(),
                {
                  notificationStatus: {
                    requestNotified:
                      existingRedemption.notificationStatus?.requestNotified ||
                      false,
                    processingNotified:
                      existingRedemption.notificationStatus
                        ?.processingNotified || false,
                    fulfilledNotified:
                      existingRedemption.notificationStatus
                        ?.fulfilledNotified || false,
                    cancelledNotified: false,
                  },
                },
              );
            }
          } else {
            console.log(
              "[SOLANA] ℹ️ RedemptionCancelled email notification already sent, skipping duplicate",
            );
          }

          return { action: "updated" };
        } else {
          console.log(
            "[SOLANA] ❌ No redemption record found for requestId:",
            requestIdStr,
          );
        }

        return { action: "skipped" }; // Use valid return type
      } catch (error) {
        console.error("[SOLANA] Error in cancellation check:", error);
        return { action: "skipped" };
      }
      // End of function - return handled above
    } catch (error) {
      console.error(
        "[SOLANA] Error processing RedemptionCancelled event with DB check:",
        error,
      );
      return { action: "skipped" };
    }
  }
}
