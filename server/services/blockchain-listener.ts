import { ethers } from "ethers";
import { storage } from "../storage/index.js";
import { Logger } from "../utils/logger.js";
import { goldApiService } from "./goldapi.service.js";
import { coinGeckoService } from "./coingecko.service.js";
import { BlockchainEmailService } from "./blockchain-email.service.js";
import { ENV } from "@shared/constants";

// Contract ABIs
const TransferWithFeeEvent = [
  "event TransferWithFee(address indexed from, address indexed to, uint256 value, uint256 fee)",
];

const RedemptionRequestedEvent = [
  "event RedemptionRequested(uint256 indexed requestId, address indexed user, uint256 amount)",
];

const TokensMintedEvent = [
  "event TokensMinted(address indexed to, uint256 amount, address indexed controller)",
];

// Standard ERC20 Transfer event - mint events are Transfer from zero address
const TransferEvent = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const RedemptionProcessingEvent = [
  "event RedemptionProcessing(uint256 indexed requestId, address indexed user, uint256 amount)",
];

const RedemptionFulfilledEvent = [
  "event RedemptionFulfilled(uint256 indexed requestId, address indexed user, uint256 amount)",
];

const RedemptionCancelledEvent = [
  "event RedemptionCancelled(uint256 indexed requestId, address indexed user, uint256 amount)",
];

interface TransferWithFeeEventData {
  from: string;
  to: string;
  value: bigint;
  fee: bigint;
  transactionHash: string;
  blockNumber: number;
  tokenAddress: string;
}

interface RedemptionRequestedEventData {
  requestId: bigint;
  user: string;
  amount: bigint;
  transactionHash: string;
  blockNumber: number;
  tokenAddress: string;
}

interface TokensMintedEventData {
  to: string;
  amount: bigint;
  controller: string;
  transactionHash: string;
  blockNumber: number;
  tokenAddress: string;
}

interface RedemptionProcessingEventData {
  requestId: bigint;
  user: string;
  amount: bigint;
  transactionHash: string;
  blockNumber: number;
  tokenAddress: string;
}

interface RedemptionFulfilledEventData {
  requestId: bigint;
  user: string;
  amount: bigint;
  transactionHash: string;
  blockNumber: number;
  tokenAddress: string;
}

interface RedemptionCancelledEventData {
  requestId: bigint;
  user: string;
  amount: bigint;
  transactionHash: string;
  blockNumber: number;
  tokenAddress: string;
}

interface TokenConfig {
  gramsPerToken: number;
  price: number;
  address: string;
  contract?: ethers.Contract;
}

interface ContractEventHandlers {
  contract: ethers.Contract;
  tokenType: "GOLD" | "SILVER";
  transferHandler: (...args: any[]) => Promise<void>;
  standardTransferHandler: (...args: any[]) => Promise<void>;
  redemptionHandler: (...args: any[]) => Promise<void>;
  tokensMintedHandler: (...args: any[]) => Promise<void>;
  redemptionProcessingHandler: (...args: any[]) => Promise<void>;
  redemptionFulfilledHandler: (...args: any[]) => Promise<void>;
  redemptionCancelledHandler: (...args: any[]) => Promise<void>;
}

export class BlockchainListener {
  private provider: ethers.JsonRpcProvider | null = null;
  private tokenConfigs: Record<"GOLD" | "SILVER", TokenConfig | null> = {
    GOLD: null,
    SILVER: null,
  };
  private eventHandlers: ContractEventHandlers[] = [];
  private isListening = false;
  private readonly BLOCKS_TO_PROCESS = 100;
  private readonly BATCH_SIZE = 10; // Process events in batches (Alchemy free tier limit)
  private readonly MAX_RETRIES = 20;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    try {
      const rpcUrl =
        process.env.ETHEREUM_RPC_URL || "https://eth-holesky.g.alchemy.com/v2/EdUntStbXZaSHzY-svGENPy8lkmOh5l2";
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Ensure environment variables are set
      if (!process.env.EVM_GOLD_TOKEN_CONTRACT) {
        process.env.EVM_GOLD_TOKEN_CONTRACT =
          "0x80252959484b49D90ffe2259b7073FfE2F01C470";
      }
      if (!process.env.EVM_SILVER_TOKEN_CONTRACT) {
        process.env.EVM_SILVER_TOKEN_CONTRACT =
          "0x3e2cCB6dEA28c251bF882d590A209836495d07D7";
      }

      // Initialize token configurations
      await this.initializeTokenConfigs();

      Logger.info("Blockchain listener initialized with RPC:", rpcUrl);
      Logger.info("Gold contract:", process.env.EVM_GOLD_TOKEN_CONTRACT);
      Logger.info("Silver contract:", process.env.EVM_SILVER_TOKEN_CONTRACT);
    } catch (error) {
      Logger.error("Failed to initialize blockchain listener:", error);
    }
  }

  private async initializeTokenConfigs() {
    const goldTokenAddress = process.env.EVM_GOLD_TOKEN_CONTRACT?.trim();
    const silverTokenAddress = process.env.EVM_SILVER_TOKEN_CONTRACT?.trim();

    // Get token prices from Gold API or use defaults
    let goldPrice = 65.5; // default fallback
    let silverPrice = 0.85; // default fallback

    try {
      const goldPriceData = await goldApiService.getGoldPrice();
      goldPrice = goldPriceData.price_gram_24k || 108.87;
      Logger.info(`Fetched gold price from API: $${goldPrice}/gram`);
    } catch (error) {
      Logger.warn("Failed to fetch gold price from API, using default:", error);
    }

    try {
      const silverPriceData = await goldApiService.getSilverPrice();
      silverPrice = silverPriceData.price_gram_24k || 1.22;
      Logger.info(`Fetched silver price from API: $${silverPrice}/gram`);
    } catch (error) {
      Logger.warn(
        "Failed to fetch silver price from API, using default:",
        error,
      );
    }

    if (goldTokenAddress && this.provider) {
      // Get milligrams per token from environment and convert to grams for calculation
      const goldMgPerToken = parseFloat(process.env.GOLD_MG_PER_TOKEN || "10");
      const goldGramsPerToken = goldMgPerToken / 1000; // Convert mg to grams

      this.tokenConfigs.GOLD = {
        gramsPerToken: goldGramsPerToken,
        price: goldPrice,
        address: goldTokenAddress,
        contract: new ethers.Contract(
          goldTokenAddress,
          [
            ...TransferWithFeeEvent,
            ...RedemptionRequestedEvent,
            ...TokensMintedEvent,
            ...RedemptionProcessingEvent,
            ...RedemptionFulfilledEvent,
            ...RedemptionCancelledEvent,
            ...TransferEvent,
          ],
          this.provider,
        ),
      };
    }

    if (silverTokenAddress && this.provider) {
      // Get milligrams per token from environment and convert to grams for calculation
      const silverMgPerToken = parseFloat(
        process.env.SILVER_MG_PER_TOKEN || "10",
      );
      const silverGramsPerToken = silverMgPerToken / 1000; // Convert mg to grams

      this.tokenConfigs.SILVER = {
        gramsPerToken: silverGramsPerToken,
        price: silverPrice,
        address: silverTokenAddress,
        contract: new ethers.Contract(
          silverTokenAddress,
          [
            ...TransferWithFeeEvent,
            ...RedemptionRequestedEvent,
            ...TokensMintedEvent,
            ...RedemptionProcessingEvent,
            ...RedemptionFulfilledEvent,
            ...RedemptionCancelledEvent,
            ...TransferEvent,
          ],
          this.provider,
        ),
      };
    }
  }

  async startListening() {
    if (this.isListening || !this.provider) {
      Logger.warn("Already listening or provider not initialized");
      return;
    }

    this.isListening = true;
    Logger.info("Starting Ethereum blockchain event listener");
    Logger.info("🥇 Gold contract:", process.env.EVM_GOLD_TOKEN_CONTRACT);
    Logger.info("🥈 Silver contract:", process.env.EVM_SILVER_TOKEN_CONTRACT);

    try {
      const currentBlock = await this.retryOperation(() =>
        this.provider!.getBlockNumber(),
      );
      const fromBlock = Math.max(0, currentBlock - this.BLOCKS_TO_PROCESS);

      Logger.info(
        `Processing events from block ${fromBlock} to ${currentBlock}`,
      );

      // Process historical events first
      await this.processHistoricalEvents(fromBlock, currentBlock);

      // Then set up real-time listeners
      await this.setupRealtimeListeners();
    } catch (error) {
      Logger.error("Error setting up blockchain listeners:", error);
      this.isListening = false;
    }
  }

  private async processHistoricalEvents(fromBlock: number, toBlock: number) {
    const tokenTypes = (
      Object.keys(this.tokenConfigs) as Array<"GOLD" | "SILVER">
    ).filter((type) => this.tokenConfigs[type]?.contract);

    for (const tokenType of tokenTypes) {
      const config = this.tokenConfigs[tokenType]!;

      try {
        // Process in batches to avoid RPC limits
        for (
          let start = fromBlock;
          start <= toBlock;
          start += this.BATCH_SIZE
        ) {
          const end = Math.min(start + this.BATCH_SIZE - 1, toBlock);

          await this.processBatchEvents(
            config.contract!,
            tokenType,
            start,
            end,
          );

          // Small delay to avoid rate limiting
          await this.delay(100);
        }
      } catch (error) {
        Logger.error(`Error processing historical ${tokenType} events:`, error);
      }
    }
  }

  private async processBatchEvents(
    contract: ethers.Contract,
    tokenType: "GOLD" | "SILVER",
    fromBlock: number,
    toBlock: number,
  ) {
    try {
      // Process TransferWithFee events
      const transferEvents = await this.retryOperation(() =>
        contract.queryFilter("TransferWithFee", fromBlock, toBlock),
      );

      Logger.info(
        `Found ${transferEvents.length} ${tokenType} TransferWithFee events (blocks ${fromBlock}-${toBlock})`,
      );

      for (const event of transferEvents) {
        await this.processEventLog(event, tokenType);
      }

      // Process RedemptionRequested events
      const redemptionEvents = await this.retryOperation(() =>
        contract.queryFilter("RedemptionRequested", fromBlock, toBlock),
      );

      Logger.info(
        `Found ${redemptionEvents.length} ${tokenType} RedemptionRequested events (blocks ${fromBlock}-${toBlock})`,
      );

      for (const event of redemptionEvents) {
        await this.handleRedemptionEvent(event, tokenType);
      }

      // Process TokensMinted events
      const tokensMintedEvents = await this.retryOperation(() =>
        contract.queryFilter("TokensMinted", fromBlock, toBlock),
      );

      Logger.info(
        `Found ${tokensMintedEvents.length} ${tokenType} TokensMinted events (blocks ${fromBlock}-${toBlock})`,
      );

      for (const event of tokensMintedEvents) {
        await this.handleTokensMintedEvent(event, tokenType);
      }

      // Process RedemptionProcessing events
      const redemptionProcessingEvents = await this.retryOperation(() =>
        contract.queryFilter("RedemptionProcessing", fromBlock, toBlock),
      );

      Logger.info(
        `Found ${redemptionProcessingEvents.length} ${tokenType} RedemptionProcessing events (blocks ${fromBlock}-${toBlock})`,
      );

      for (const event of redemptionProcessingEvents) {
        await this.handleRedemptionProcessingEvent(event, tokenType);
      }

      // Process RedemptionFulfilled events
      const redemptionFulfilledEvents = await this.retryOperation(() =>
        contract.queryFilter("RedemptionFulfilled", fromBlock, toBlock),
      );

      Logger.info(
        `Found ${redemptionFulfilledEvents.length} ${tokenType} RedemptionFulfilled events (blocks ${fromBlock}-${toBlock})`,
      );

      for (const event of redemptionFulfilledEvents) {
        await this.handleRedemptionFulfilledEvent(event, tokenType);
      }

      // Process RedemptionCancelled events
      const redemptionCancelledEvents = await this.retryOperation(() =>
        contract.queryFilter("RedemptionCancelled", fromBlock, toBlock),
      );

      Logger.info(
        `Found ${redemptionCancelledEvents.length} ${tokenType} RedemptionCancelled events (blocks ${fromBlock}-${toBlock})`,
      );

      for (const event of redemptionCancelledEvents) {
        await this.handleRedemptionCancelledEvent(event, tokenType);
      }

      // Process standard Transfer events
      const transferStandardEvents = await this.retryOperation(() =>
        contract.queryFilter("Transfer", fromBlock, toBlock),
      );

      Logger.info(
        `Found ${transferStandardEvents.length} ${tokenType} Transfer events (blocks ${fromBlock}-${toBlock})`,
      );

      for (const event of transferStandardEvents) {
        await this.handleStandardTransferEvent(event, tokenType);
      }
    } catch (error) {
      Logger.error(`Error processing batch events for ${tokenType}:`, error);
    }
  }

  private async setupRealtimeListeners() {
    // Clear existing handlers
    this.eventHandlers = [];

    for (const [tokenType, config] of Object.entries(
      this.tokenConfigs,
    ) as Array<[keyof typeof this.tokenConfigs, TokenConfig | null]>) {
      if (!config?.contract) continue;

      const transferHandler = async (...args: any[]) => {
        try {
          Logger.info(`Real-time ${tokenType} TransferWithFee event detected`);
          const event = args[args.length - 1];
          await this.processEventLog(event, tokenType);
        } catch (error) {
          Logger.error(
            `Error processing real-time ${tokenType} TransferWithFee event:`,
            error,
          );
        }
      };

      const redemptionHandler = async (...args: any[]) => {
        try {
          // Apply 500ms initial wait to handle race conditions with frontend operations
          await this.waitBeforeProcessing();
          Logger.info(
            `Real-time ${tokenType} RedemptionRequested event detected`,
          );
          const event = args[args.length - 1];
          await this.handleRedemptionEvent(event, tokenType);
        } catch (error) {
          Logger.error(
            `Error processing real-time ${tokenType} RedemptionRequested event:`,
            error,
          );
        }
      };

      const tokensMintedHandler = async (...args: any[]) => {
        try {
          // Apply 500ms initial wait to handle race conditions with frontend operations
          await this.waitBeforeProcessing();
          Logger.info(`Real-time ${tokenType} TokensMinted event detected`);
          const event = args[args.length - 1];
          await this.handleTokensMintedEvent(event, tokenType);
        } catch (error) {
          Logger.error(
            `Error processing real-time ${tokenType} TokensMinted event:`,
            error,
          );
        }
      };

      const redemptionProcessingHandler = async (...args: any[]) => {
        try {
          // Apply 500ms initial wait to handle race conditions with frontend operations
          await this.waitBeforeProcessing();
          Logger.info(
            `Real-time ${tokenType} RedemptionProcessing event detected`,
          );
          const event = args[args.length - 1];
          await this.handleRedemptionProcessingEvent(event, tokenType);
        } catch (error) {
          Logger.error(
            `Error processing real-time ${tokenType} RedemptionProcessing event:`,
            error,
          );
        }
      };

      const redemptionFulfilledHandler = async (...args: any[]) => {
        try {
          // Apply 500ms initial wait to handle race conditions with frontend operations
          await this.waitBeforeProcessing();
          Logger.info(
            `Real-time ${tokenType} RedemptionFulfilled event detected`,
          );
          const event = args[args.length - 1];
          await this.handleRedemptionFulfilledEvent(event, tokenType);
        } catch (error) {
          Logger.error(
            `Error processing real-time ${tokenType} RedemptionFulfilled event:`,
            error,
          );
        }
      };

      const redemptionCancelledHandler = async (...args: any[]) => {
        try {
          // Apply 500ms initial wait to handle race conditions with frontend operations
          await this.waitBeforeProcessing();
          Logger.info(
            `Real-time ${tokenType} RedemptionCancelled event detected`,
          );
          const event = args[args.length - 1];
          await this.handleRedemptionCancelledEvent(event, tokenType);
        } catch (error) {
          Logger.error(
            `Error processing real-time ${tokenType} RedemptionCancelled event:`,
            error,
          );
        }
      };

      // Standard Transfer event handler (for regular ERC-20 transfers)
      const standardTransferHandler = async (...args: any[]) => {
        try {
          Logger.info(`Real-time ${tokenType} Transfer event detected`);
          const event = args[args.length - 1];
          await this.handleStandardTransferEvent(event, tokenType);
        } catch (error) {
          Logger.error(
            `Error processing real-time ${tokenType} Transfer event:`,
            error,
          );
        }
      };

      // Set up listeners
      config.contract.on("TransferWithFee", transferHandler);
      config.contract.on("Transfer", standardTransferHandler);
      config.contract.on("RedemptionRequested", redemptionHandler);
      config.contract.on("TokensMinted", tokensMintedHandler);
      config.contract.on("RedemptionProcessing", redemptionProcessingHandler);
      config.contract.on("RedemptionFulfilled", redemptionFulfilledHandler);
      config.contract.on("RedemptionCancelled", redemptionCancelledHandler);

      // Store handlers for cleanup
      this.eventHandlers.push({
        contract: config.contract,
        tokenType,
        transferHandler,
        standardTransferHandler,
        redemptionHandler,
        tokensMintedHandler,
        redemptionProcessingHandler,
        redemptionFulfilledHandler,
        redemptionCancelledHandler,
      });

      Logger.info(`Set up real-time listeners for ${tokenType} token`);
    }
  }

  private async processEventLog(event: any, tokenType: "GOLD" | "SILVER") {
    try {
      const transactionHash = this.extractTransactionHash(event);
      if (!transactionHash) {
        Logger.error(
          `Could not extract transaction hash from ${tokenType} event`,
        );
        return;
      }

      const eventData: TransferWithFeeEventData = {
        from: event.args[0],
        to: event.args[1],
        value: event.args[2],
        fee: event.args[3],
        transactionHash,
        blockNumber: event.blockNumber || event.log?.blockNumber || 0,
        tokenAddress: event.address || event.log?.address || "",
      };

      await this.processTransferEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(`Error processing ${tokenType} event log:`, error);
    }
  }

  /**
   * Wait before processing blockchain events to handle race conditions with frontend operations
   */
  private async waitBeforeProcessing(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Retry database operations with exponential backoff for concurrent operations
   */
  private async retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 10,
    delay: number = 500,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        Logger.warn(
          `Database operation attempt ${attempt}/${maxRetries} failed:`,
          error,
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError;
  }

  private async processTransferEvent(
    eventData: TransferWithFeeEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      Logger.info(`🔍 Processing TransferWithFee event for ${tokenType}:`, {
        from: eventData.from,
        to: eventData.to,
        value: eventData.value.toString(),
        fee: eventData.fee.toString(),
        transactionHash: eventData.transactionHash,
        tokenAmount: ethers.formatEther(eventData.value),
        feeAmount: ethers.formatEther(eventData.fee),
      });

      // **RACE CONDITION FIX**: Wait initial 500ms for frontend record creation, then retry mechanism
      Logger.info(
        "[ETHEREUM] ⏳ Initial wait of 500ms for frontend gifting record creation...",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      let existingGifting = null;
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 500; // 500ms delay between retries

      while (retryCount < maxRetries && !existingGifting) {
        if ((storage as any).getGiftingByTransactionHashWithUserData) {
          existingGifting = await (
            storage as any
          ).getGiftingByTransactionHashWithUserData(eventData.transactionHash);
        } else {
          existingGifting = await storage.getGiftingByTransactionHash(
            eventData.transactionHash,
          );
        }

        if (!existingGifting) {
          Logger.info(
            `[ETHEREUM] ⏳ Gifting record not found (attempt ${retryCount + 1}/${maxRetries}), waiting for frontend creation...`,
          );
          Logger.info(
            `[ETHEREUM] 🔍 Searching for transaction: ${eventData.transactionHash}`,
          );

          if (retryCount < maxRetries - 1) {
            // Wait before next retry with longer delay
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        } else {
          Logger.info(
            `[ETHEREUM] ✅ Found gifting record on attempt ${retryCount + 1}`,
          );
        }

        retryCount++;
      }

      Logger.info(
        `[ETHEREUM] 📋 Final result after initial wait + ${retryCount} retry attempts: ${existingGifting ? "FOUND" : "NOT_FOUND"}`,
      );

      if (existingGifting) {
        if (existingGifting.status === "pending") {
          await this.updatePendingGifting(
            existingGifting,
            eventData,
            tokenType,
          );
        } else if (existingGifting.status === "completed") {
          Logger.info(
            `✓ ${tokenType} Transfer Event Found - Transaction Already Processed:`,
            {
              transactionHash: eventData.transactionHash,
              giftingId: existingGifting._id,
              fromAddress: eventData.from,
              toAddress: eventData.to,
              tokenAmount: ethers.formatEther(eventData.value),
              feeAmount: ethers.formatEther(eventData.fee),
              status: existingGifting.status,
              existingRecord: true,
            },
          );
        }
        return;
      }

      // Create new gifting record from blockchain event
      await this.createGiftingFromEvent(eventData, tokenType);
    } catch (error) {
      Logger.error("Error processing TransferWithFee event:", error);
    }
  }

  private async updatePendingGifting(
    existingGifting: any,
    eventData: TransferWithFeeEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    Logger.info(
      `Updating pending gifting record to completed for transaction ${eventData.transactionHash}`,
    );

    const { tokenAmount, feeAmount, calculations } =
      await this.calculateTokenAmounts(eventData, tokenType);

    await storage.updateGifting(existingGifting._id, {
      status: "completed",
      networkFee: calculations.networkFee,
      recipientWallet: eventData.to,
      notified: true,
    });

    Logger.info(`Updated pending gifting record to completed:`, {
      giftingId: existingGifting._id,
      transactionHash: eventData.transactionHash,
      tokenType,
      amount: tokenAmount,
      preservedMessage: existingGifting.message,
    });

    // Send email notifications to both sender and receiver for transfer/gifting completion
    try {
      // Send notification to sender
      await BlockchainEmailService.sendBlockchainEventNotification({
        eventType: "TRANSFER",
        network: "Ethereum",
        walletAddress: eventData.from,
        transactionHash: eventData.transactionHash,
        tokenType: tokenType as "GOLD" | "SILVER",
        amount: tokenAmount,
        fromAddress: eventData.from,
        toAddress: eventData.to,
        blockNumber: eventData.blockNumber,
        isSender: true,
      });

      // Send notification to receiver
      await BlockchainEmailService.sendBlockchainEventNotification({
        eventType: "TRANSFER",
        network: "Ethereum",
        walletAddress: eventData.to,
        transactionHash: eventData.transactionHash,
        tokenType: tokenType as "GOLD" | "SILVER",
        amount: tokenAmount,
        fromAddress: eventData.from,
        toAddress: eventData.to,
        blockNumber: eventData.blockNumber,
        isSender: false,
      });

      Logger.info(
        `📧 Transfer notifications sent to both parties for ${tokenType} gifting:`,
        {
          transactionHash: eventData.transactionHash,
          fromAddress: eventData.from,
          toAddress: eventData.to,
        },
      );
    } catch (emailError) {
      Logger.error("Failed to send transfer notification:", emailError);
    }
  }

  private async createGiftingFromEvent(
    eventData: TransferWithFeeEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    const { tokenAmount, calculations } = await this.calculateTokenAmounts(
      eventData,
      tokenType,
    );
    // REQUIRED: Use populate method for wallet-to-user lookup with user data
    let senderUserData;
    if ((storage as any).getUserIdByWalletAddressWithUserData) {
      senderUserData = await (
        storage as any
      ).getUserIdByWalletAddressWithUserData(eventData.from);
    } else {
      const senderUserId = await storage.getUserIdByWalletAddress(
        eventData.from,
      );
      if (senderUserId) {
        const userData = await storage.getUserInfo(senderUserId);
        senderUserData = { userId: senderUserId, user_info: userData };
      }
    }

    let userInfo;
    if (senderUserData?.user_info) {
      userInfo = senderUserData.user_info;
    }

    if (!userInfo) {
      userInfo = {
        id: "blockchain-event",
        name: "Blockchain Event",
        email: "blockchain@event.system",
      };
    }

    // Ensure userId is always a string, never create records with "blockchain-event" placeholder
    if (
      !senderUserData?.userId ||
      senderUserData.userId === "blockchain-event"
    ) {
      Logger.warn(
        `Cannot create gifting record: No valid user found for wallet ${eventData.from}`,
        {
          transactionHash: eventData.transactionHash,
          senderWallet: eventData.from,
          recipientWallet: eventData.to,
        },
      );
      return;
    }

    const giftingData = {
      userId: senderUserData.userId, // Always a valid string userId
      recipientWallet: eventData.to,
      token: tokenType.toLowerCase() as "gold" | "silver",
      quantity: tokenAmount,
      message: "Auto-created from blockchain event",
      network: "public" as const,
      status: "completed" as const,
      transactionHash: eventData.transactionHash,
      networkFee: calculations.networkFee,
      tokenValueUSD: calculations.tokenValueUSD,
      totalCostUSD: calculations.totalCostUSD,
      gramsAmount: calculations.gramsAmount,
      notified: true,
    };

    const gifting = await storage.createGifting(giftingData);

    // Send email notifications to both sender and receiver for new transfer/gifting from blockchain event
    try {
      // Send notification to sender
      await BlockchainEmailService.sendBlockchainEventNotification({
        eventType: "TRANSFER",
        network: "Ethereum",
        walletAddress: eventData.from,
        transactionHash: eventData.transactionHash,
        tokenType: tokenType as "GOLD" | "SILVER",
        amount: tokenAmount,
        fromAddress: eventData.from,
        toAddress: eventData.to,
        blockNumber: eventData.blockNumber,
        isSender: true,
      });

      // Send notification to receiver
      await BlockchainEmailService.sendBlockchainEventNotification({
        eventType: "TRANSFER",
        network: "Ethereum",
        walletAddress: eventData.to,
        transactionHash: eventData.transactionHash,
        tokenType: tokenType as "GOLD" | "SILVER",
        amount: tokenAmount,
        fromAddress: eventData.from,
        toAddress: eventData.to,
        blockNumber: eventData.blockNumber,
        isSender: false,
      });

      Logger.info(
        `📧 Transfer notifications sent to both parties for new ${tokenType} gifting:`,
        {
          transactionHash: eventData.transactionHash,
          fromAddress: eventData.from,
          toAddress: eventData.to,
        },
      );
    } catch (emailError) {
      Logger.error("Failed to send transfer notification:", emailError);
    }

    Logger.info(
      `🎉 NEW ${tokenType} Transfer Event Processed - Created Gifting Record:`,
      {
        giftingId: gifting._id,
        transactionHash: eventData.transactionHash,
        tokenType,
        tokenAmount: tokenAmount,
        fromAddress: eventData.from,
        toAddress: eventData.to,
        senderUserId: senderUserData?.userId || "unknown",
        feeAmount: ethers.formatEther(eventData.fee),
        tokenValueUSD: calculations.tokenValueUSD,
        gramsAmount: calculations.gramsAmount,
        newRecord: true,
      },
    );
  }

  private async handleRedemptionEvent(
    event: any,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const transactionHash = this.extractTransactionHash(event);
      if (!transactionHash) {
        Logger.error(
          `Could not extract transaction hash from ${tokenType} redemption event`,
        );
        return;
      }

      const eventData: RedemptionRequestedEventData = {
        requestId: event.args[0],
        user: event.args[1],
        amount: event.args[2],
        transactionHash,
        blockNumber: event.blockNumber || event.log?.blockNumber || 0,
        tokenAddress: event.address || event.log?.address || "",
      };

      await this.processRedemptionEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(
        `Error processing ${tokenType} redemption event log:`,
        error,
      );
    }
  }

  private async processRedemptionEvent(
    eventData: RedemptionRequestedEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      Logger.info(`Processing RedemptionRequested event for ${tokenType}:`, {
        requestId: eventData.requestId.toString(),
        user: eventData.user,
        amount: eventData.amount.toString(),
        transactionHash: eventData.transactionHash,
      });

      // **RACE CONDITION FIX**: Wait initial 500ms for frontend record creation, then retry mechanism
      Logger.info(
        "[ETHEREUM] ⏳ Initial wait of 500ms for frontend redemption record creation...",
      );
      await new Promise((resolve) => setTimeout(resolve, 500));

      let existingRedemption = null;
      let retryCount = 0;
      const maxRetries = 10; // Increased from 3 to 10 as requested
      const retryDelay = 500; // 500ms delay between retries

      while (retryCount < maxRetries && !existingRedemption) {
        if ((storage as any).getRedemptionByTransactionHashWithUserData) {
          existingRedemption = await (
            storage as any
          ).getRedemptionByTransactionHashWithUserData(
            eventData.transactionHash,
          );
        } else {
          existingRedemption = await storage.getRedemptionByTransactionHash(
            eventData.transactionHash,
          );
        }

        if (!existingRedemption) {
          Logger.info(
            `[ETHEREUM] ⏳ Redemption record not found (attempt ${retryCount + 1}/${maxRetries}), waiting for frontend creation...`,
          );
          Logger.info(
            `[ETHEREUM] 🔍 Searching for transaction: ${eventData.transactionHash}`,
          );

          if (retryCount < maxRetries - 1) {
            // Wait before next retry with longer delay
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        } else {
          Logger.info(
            `[ETHEREUM] ✅ Found redemption record on attempt ${retryCount + 1}`,
          );
        }

        retryCount++;
      }

      Logger.info(
        `[ETHEREUM] 📋 Final result after initial wait + ${retryCount} retry attempts: ${existingRedemption ? "FOUND" : "NOT_FOUND"}`,
      );

      if (existingRedemption) {
        if (
          !existingRedemption.requestId ||
          existingRedemption.requestId === "" ||
          existingRedemption.requestId === "null"
        ) {
          Logger.info(
            `Found existing redemption without requestId - updating with requestId: ${eventData.requestId.toString()}`,
          );
          await this.updatePendingRedemption(
            existingRedemption,
            eventData,
            tokenType,
          );
        } else {
          Logger.info(
            `Redemption record already exists with requestId ${existingRedemption.requestId} for transaction ${eventData.transactionHash}`,
          );
        }
        return;
      }

      // Create new redemption record from blockchain event
      await this.createRedemptionFromEvent(eventData, tokenType);
    } catch (error) {
      Logger.error("Error processing RedemptionRequested event:", error);
    }
  }

  private async updatePendingRedemption(
    existingRedemption: any,
    eventData: RedemptionRequestedEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    Logger.info(
      `Updating pending redemption record for transaction ${eventData.transactionHash}`,
    );

    const { tokenAmount, calculations } = await this.calculateRedemptionAmounts(
      eventData,
      tokenType,
    );

    // Get delivery fee from existing record or use default
    const deliveryFee = parseFloat(
      existingRedemption.deliveryFee || process.env.DELIVERY_FEE || "25.99",
    );

    // Convert total USD cost (token value + delivery fee) to ETH
    const totalUsdCost = parseFloat(calculations.tokenValueUSD) + deliveryFee;
    const totalCostInEth = await this.convertUsdToEth(totalUsdCost);

    const updateData: any = {
      status: "pending",
      token: tokenType.toLowerCase(),
      quantity: tokenAmount,
      gramsAmount: calculations.gramsAmount,
      tokenValueUSD: calculations.tokenValueUSD,
      totalCostUSD: totalCostInEth.toString(),
      network: "public",
      requestId: eventData.requestId.toString(),
    };
    await storage.updateRedemptionByTransactionHash(
      eventData.transactionHash,
      updateData,
    );

    Logger.info(`Updated pending redemption record:`, {
      transactionHash: eventData.transactionHash,
      tokenType,
      amount: tokenAmount,
      preservedAddress: existingRedemption.deliveryAddress,
    });

    // Send email notification for redemption request
    try {
      await BlockchainEmailService.sendBlockchainEventNotification({
        eventType: "REQUEST_REDEMPTION",
        network: "Ethereum",
        walletAddress: eventData.user,
        transactionHash: eventData.transactionHash,
        tokenType: tokenType as "GOLD" | "SILVER",
        amount: tokenAmount,
        requestId: eventData.requestId.toString(),
      });

      // Only set notified flags AFTER successful email sending
      const notificationUpdateData: any = {
        "notificationStatus.requestNotified": true,
      };
      await storage.updateRedemptionByTransactionHash(
        eventData.transactionHash,
        notificationUpdateData,
      );

      Logger.info(`📧 Redemption request notification sent for ${tokenType}:`, {
        transactionHash: eventData.transactionHash,
        requestId: eventData.requestId.toString(),
      });
    } catch (emailError) {
      Logger.error(
        "Failed to send redemption request notification:",
        emailError,
      );
    }
  }

  private async createRedemptionFromEvent(
    eventData: RedemptionRequestedEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    Logger.info(
      `🔍 Creating redemption from blockchain event for ${tokenType}:`,
      {
        walletAddress: eventData.user,
        transactionHash: eventData.transactionHash,
        requestId: eventData.requestId.toString(),
      },
    );

    const { tokenAmount, calculations } = await this.calculateRedemptionAmounts(
      eventData,
      tokenType,
    );

    // ENHANCED DEBUG: Check wallet-to-user lookup
    Logger.info(`🔍 Looking up user for wallet address: ${eventData.user}`);
    let walletUserData;
    if ((storage as any).getUserIdByWalletAddressWithUserData) {
      walletUserData = await (
        storage as any
      ).getUserIdByWalletAddressWithUserData(eventData.user);
      Logger.info(
        `🔍 Enhanced wallet lookup result:`,
        walletUserData || "null",
      );
    } else {
      const userIdFromWallet = await storage.getUserIdByWalletAddress(
        eventData.user,
      );
      Logger.info(
        `🔍 Basic wallet lookup result: ${userIdFromWallet || "null"}`,
      );
      if (userIdFromWallet) {
        const userData = await storage.getUserInfo(userIdFromWallet);
        walletUserData = { userId: userIdFromWallet, user_info: userData };
        Logger.info(`🔍 User data retrieved:`, userData || "null");
      }
    }

    let userInfo;
    if (walletUserData?.user_info) {
      userInfo = walletUserData.user_info;
    }

    if (!userInfo) {
      userInfo = {
        id: "blockchain-event",
        name: "Blockchain Event",
        email: "blockchain@event.system",
      };
    }

    const deliveryFee = parseFloat(process.env.DELIVERY_FEE || "25.99");

    // Convert total USD cost (token value + delivery fee) to ETH
    const totalUsdCost = parseFloat(calculations.tokenValueUSD) + deliveryFee;
    const totalCostInEth = await this.convertUsdToEth(totalUsdCost);

    // Ensure userId is properly handled - skip creation if no valid user found
    if (!walletUserData?.userId) {
      Logger.warn(
        `No user found for wallet address ${eventData.user}, skipping redemption creation`,
      );
      return;
    }

    const redemptionData = {
      userId: walletUserData.userId, // Use actual user ID from wallet lookup (will be converted to ObjectId in storage layer)
      token: tokenType.toLowerCase() as any,
      quantity: tokenAmount,
      gramsAmount: calculations.gramsAmount,
      tokenValueUSD: calculations.tokenValueUSD,
      network: "public" as const,
      status: "pending" as const,
      transactionHash: eventData.transactionHash,
      deliveryFee: deliveryFee.toString(),
      totalCostUSD: totalCostInEth.toString(),
      requestId: eventData.requestId.toString(),
      walletAddress: eventData.user, // Store wallet address for association
      notificationStatus: {
        requestNotified: false,
        processingNotified: false,
        fulfilledNotified: false,
        cancelledNotified: false,
      },
    };

    const redemption = await storage.createRedemption(redemptionData);

    // Send email notification for new redemption request
    try {
      await BlockchainEmailService.sendBlockchainEventNotification({
        eventType: "REQUEST_REDEMPTION",
        network: "Ethereum",
        walletAddress: eventData.user,
        transactionHash: eventData.transactionHash,
        tokenType: tokenType as "GOLD" | "SILVER",
        amount: tokenAmount,
        requestId: eventData.requestId.toString(),
      });

      // Only set notified flag AFTER successful email sending
      const notificationUpdateData: any = {
        "notificationStatus.requestNotified": true,
      };
      await storage.updateRedemption(
        redemption._id!.toString(),
        notificationUpdateData,
      );

      Logger.info(
        `📧 Redemption request notification sent for new ${tokenType} redemption:`,
        {
          redemptionId: redemption._id,
          transactionHash: eventData.transactionHash,
          requestId: eventData.requestId.toString(),
        },
      );
    } catch (emailError) {
      Logger.error(
        "Failed to send redemption request notification:",
        emailError,
      );
    }

    Logger.info(`Created redemption record from blockchain event:`, {
      redemptionId: redemption._id,
      transactionHash: eventData.transactionHash,
      tokenType,
      amount: tokenAmount,
      userIdFromWallet: walletUserData?.userId || "unknown",
      userAddress: eventData.user,
    });
  }

  private async calculateTokenAmounts(
    eventData: TransferWithFeeEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    const tokenAmount = ethers.formatEther(eventData.value);
    const feeAmount = ethers.formatEther(eventData.fee);
    const tokenConfig = this.tokenConfigs[tokenType]!;

    const gramsAmount = (
      parseFloat(tokenAmount) * tokenConfig.gramsPerToken
    ).toString();
    const tokenValueUSD = (
      parseFloat(tokenAmount) * tokenConfig.price
    ).toString();

    // Network fee should be stored as ETH amount, not multiplied by token price
    const networkFee = feeAmount; // Keep as ETH amount (0.002 ETH)

    // Convert only token value USD to ETH for total cost calculation
    const totalCostUSD = await this.convertUsdToEth(parseFloat(tokenValueUSD));

    return {
      tokenAmount,
      feeAmount,
      calculations: {
        gramsAmount,
        tokenValueUSD,
        networkFee,
        totalCostUSD: totalCostUSD.toString(),
      },
    };
  }

  private async calculateRedemptionAmounts(
    eventData: RedemptionRequestedEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    const tokenAmount = ethers.formatEther(eventData.amount);
    const tokenConfig = this.tokenConfigs[tokenType]!;

    const gramsAmount = (
      parseFloat(tokenAmount) * tokenConfig.gramsPerToken
    ).toString();
    const tokenValueUSD = (
      parseFloat(tokenAmount) * tokenConfig.price
    ).toString();

    // Convert USD value to ETH using CoinGecko API
    const totalCostUSD = await this.convertUsdToEth(parseFloat(tokenValueUSD));

    return {
      tokenAmount,
      calculations: {
        gramsAmount,
        tokenValueUSD,
        totalCostUSD: totalCostUSD.toString(),
      },
    };
  }

  private extractTransactionHash(event: any): string | null {
    // Try multiple possible locations for transaction hash
    let transactionHash = event.transactionHash || event.log?.transactionHash;

    if (!transactionHash && typeof event.getTransaction === "function") {
      // This is async but we'll handle it in the caller
      Logger.warn(
        "Transaction hash not immediately available, will need async retrieval",
      );
    }

    return transactionHash || null;
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === this.MAX_RETRIES) {
          throw error;
        }
        Logger.warn(
          `Operation failed (attempt ${attempt}/${this.MAX_RETRIES}), retrying...`,
          error,
        );
        await this.delay(this.RETRY_DELAY * attempt);
      }
    }
    throw new Error("Retry operation failed"); // This should never be reached
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convert USD amount to ETH using CoinGecko API
   * @param usdAmount - Amount in USD
   * @returns ETH equivalent amount
   */
  private async convertUsdToEth(usdAmount: number): Promise<number> {
    try {
      const ethPrice = await coinGeckoService.getEthereumPrice();
      const ethAmount = usdAmount / ethPrice;
      Logger.info(
        `Converted $${usdAmount} USD to ${ethAmount} ETH (ETH price: $${ethPrice})`,
      );
      return ethAmount;
    } catch (error) {
      Logger.warn(
        "Failed to fetch ETH price for conversion, using fallback rate:",
        error,
      );
      // Fallback ETH price if CoinGecko API fails
      const fallbackEthPrice = 2000;
      return usdAmount / fallbackEthPrice;
    }
  }

  /**
   * Process a specific transaction manually (for debugging missed events)
   */
  async processSpecificTransaction(transactionHash: string) {
    try {
      Logger.info(`🔍 Manually processing transaction: ${transactionHash}`);

      if (!this.provider) {
        throw new Error("Provider not initialized");
      }

      // Get transaction receipt
      const receipt =
        await this.provider.getTransactionReceipt(transactionHash);
      if (!receipt) {
        Logger.error(`Transaction receipt not found: ${transactionHash}`);
        return false;
      }

      Logger.info(`✅ Transaction found in block ${receipt.blockNumber}`);

      // Process each contract's events in this specific block
      for (const [tokenType, config] of Object.entries(
        this.tokenConfigs,
      ) as Array<[keyof typeof this.tokenConfigs, TokenConfig | null]>) {
        if (!config?.contract) continue;

        try {
          await this.processBatchEvents(
            config.contract,
            tokenType,
            receipt.blockNumber,
            receipt.blockNumber,
          );
          Logger.info(
            `✅ Processed ${tokenType} events for transaction ${transactionHash}`,
          );
        } catch (error) {
          Logger.error(
            `Error processing ${tokenType} events for transaction ${transactionHash}:`,
            error,
          );
        }
      }

      return true;
    } catch (error) {
      Logger.error(
        `Error processing specific transaction ${transactionHash}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Handle TokensMinted events from Ethereum
   */
  private async handleTokensMintedEvent(
    event: any,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const transactionHash = this.extractTransactionHash(event);
      if (!transactionHash) {
        Logger.error(
          `Could not extract transaction hash from ${tokenType} TokensMinted event`,
        );
        return;
      }

      // Fixed event signature: TokensMinted(address to, uint256 amount, address controller)
      const eventData: TokensMintedEventData = {
        to: event.args[0], // address to
        amount: event.args[1], // uint256 amount
        controller: event.args[2], // address controller
        transactionHash,
        blockNumber: event.blockNumber || event.log?.blockNumber || 0,
        tokenAddress: event.address || event.log?.address || "",
      };

      Logger.info(`🥇 TokensMinted Event Detected for ${tokenType}:`, {
        to: eventData.to,
        amount: ethers.formatEther(eventData.amount),
        controller: eventData.controller,
        transactionHash: eventData.transactionHash,
        blockNumber: eventData.blockNumber,
      });

      await this.processTokensMintedEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(
        `Error processing ${tokenType} TokensMinted event log:`,
        error,
      );
    }
  }

  private async processTokensMintedEvent(
    eventData: TokensMintedEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const tokenAmount = ethers.formatEther(eventData.amount);

      Logger.info(`🎉 Processing TokensMinted event for ${tokenType}:`, {
        to: eventData.to,
        amount: tokenAmount,
        controller: eventData.controller,
        transactionHash: eventData.transactionHash,
      });

      // Check if notification already sent and send email notification for mint event
      await this.retryDatabaseOperation(async () => {
        try {
          // Check if purchase history exists and notification already sent
          const purchaseRecord =
            await storage.getPurchaseHistoryByTransactionHash(
              eventData.transactionHash,
            );

          if (purchaseRecord) {
            await storage.updatePurchaseHistory(purchaseRecord._id!, {
              status: "completed",
            });

            if (purchaseRecord && purchaseRecord.notified) {
              Logger.info(
                `📧 Notification already sent for ${tokenType} mint:`,
                {
                  transactionHash: eventData.transactionHash,
                  notified: purchaseRecord.notified,
                },
              );
              return;
            }

            // Send notification
            await BlockchainEmailService.sendBlockchainEventNotification({
              eventType: "MINT",
              network: "Ethereum",
              walletAddress: eventData.to,
              transactionHash: eventData.transactionHash,
              tokenType: tokenType,
              amount: tokenAmount,
              blockNumber: eventData.blockNumber,
            });

            // Mark as notified if purchase record exists
            if (purchaseRecord) {
              await storage.updatePurchaseHistory(purchaseRecord._id!, {
                notified: true,
              });
            }

            Logger.info(
              `📧 Mint notification sent and marked as notified for ${tokenType}:`,
              {
                purchaseId: purchaseRecord._id,
                transactionHash: eventData.transactionHash,
              },
            );
          } else {
            Logger.info(
              `📧 Mint notification sent for ${tokenType} (no purchase record):`,
              {
                wallet: eventData.to,
                amount: tokenAmount,
                transactionHash: eventData.transactionHash,
              },
            );
          }
        } catch (emailError) {
          Logger.error(
            `Failed to send mint notification for ${tokenType}:`,
            emailError,
          );
        }
      });

      // Update transaction status for successful mint
      try {
        await this.retryDatabaseOperation(async () => {
          // Look for user and update their pending transactions
          const userWalletData = await storage.getUserIdByWalletAddress(
            eventData.to,
          );
          if (userWalletData) {
            Logger.info(
              `✅ Mint event detected for registered user wallet: ${eventData.to}`,
            );

            // Get user's transactions and update pending ones to completed
            const userTransactions =
              await storage.getTransactions(userWalletData);
            const pendingBuyTransactions = userTransactions.filter(
              (tx) =>
                tx.status === "pending" &&
                tx.type === "buy" &&
                tx.metalType.toLowerCase() === tokenType.toLowerCase(),
            );

            if (pendingBuyTransactions.length > 0) {
              // Update the most recent pending transaction
              const mostRecentTx = pendingBuyTransactions.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )[0];

              if (storage.updateTransaction) {
                await storage.updateTransaction(mostRecentTx._id!, {
                  status: "completed",
                });

                Logger.info(`🎯 Transaction status updated to completed:`, {
                  transactionId: mostRecentTx._id,
                  transactionHash: eventData.transactionHash,
                  tokenType: tokenType,
                  amount: tokenAmount,
                });
              }
            } else {
              Logger.info(
                `ℹ️ No pending ${tokenType} buy transactions found for user`,
              );
            }
          } else {
            Logger.info(
              `ℹ️ Mint event for unregistered wallet: ${eventData.to}`,
            );
          }
        });
      } catch (dbError) {
        Logger.warn(
          `Could not update transaction status for mint event:`,
          dbError,
        );
      }
    } catch (error) {
      Logger.error(`Error processing TokensMinted event:`, error);
    }
  }

  /**
   * Handle RedemptionProcessing events from Ethereum
   */
  private async handleRedemptionProcessingEvent(
    event: any,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const transactionHash = this.extractTransactionHash(event);
      if (!transactionHash) {
        Logger.error(
          `Could not extract transaction hash from ${tokenType} RedemptionProcessing event`,
        );
        return;
      }

      const eventData: RedemptionProcessingEventData = {
        requestId: event.args[0],
        user: event.args[1],
        amount: event.args[2],
        transactionHash,
        blockNumber: event.blockNumber || event.log?.blockNumber || 0,
        tokenAddress: event.address || event.log?.address || "",
      };

      await this.processRedemptionProcessingEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(
        `Error processing ${tokenType} RedemptionProcessing event log:`,
        error,
      );
    }
  }

  private async processRedemptionProcessingEvent(
    eventData: RedemptionProcessingEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      Logger.info(
        `⏳ Processing RedemptionProcessing event for ${tokenType}:`,
        {
          requestId: eventData.requestId.toString(),
          user: eventData.user,
          amount: eventData.amount.toString(),
          transactionHash: eventData.transactionHash,
        },
      );

      // Find redemption by requestId and update status to processing
      await this.retryDatabaseOperation(async () => {
        const redemptionRecord = await storage.getRedemptionByRequestId(
          eventData.requestId.toString(),
        );

        if (redemptionRecord && redemptionRecord._id) {
          // Check if notification already sent for this event
          if (redemptionRecord.notificationStatus?.processingNotified) {
            Logger.info(
              `📧 Notification already sent for processing ${tokenType} redemption:`,
              {
                requestId: eventData.requestId.toString(),
                transactionHash: eventData.transactionHash,
                processingNotified:
                  redemptionRecord.notificationStatus.processingNotified,
              },
            );
            return;
          }

          const processingUpdateData: any = {
            status: "processing" as any,
            updatedAt: new Date(),
            transactionHash: eventData.transactionHash,
          };
          await storage.updateRedemption(
            redemptionRecord._id.toString(),
            processingUpdateData,
          );

          Logger.info(`✅ Updated redemption to processing:`, {
            redemptionId: redemptionRecord._id,
            requestId: eventData.requestId.toString(),
            transactionHash: eventData.transactionHash,
            tokenType,
            amount: ethers.formatEther(eventData.amount),
          });

          // Send email notification for processing
          try {
            await BlockchainEmailService.sendBlockchainEventNotification({
              eventType: "REDEMPTION_PROCESSING",
              network: "Ethereum",
              walletAddress: eventData.user,
              transactionHash: eventData.transactionHash,
              tokenType: tokenType as "GOLD" | "SILVER",
              amount: ethers.formatEther(eventData.amount),
              requestId: eventData.requestId.toString(),
            });

            // Only set notified flag AFTER successful email sending
            const notificationUpdateData: any = {
              "notificationStatus.processingNotified": true,
            };
            await storage.updateRedemption(
              redemptionRecord._id.toString(),
              notificationUpdateData,
            );

            Logger.info(
              `📧 Redemption processing notification sent for ${tokenType}:`,
              {
                requestId: eventData.requestId.toString(),
                transactionHash: eventData.transactionHash,
              },
            );
          } catch (emailError) {
            Logger.error(
              "Failed to send redemption processing notification:",
              emailError,
            );
          }
        } else {
          Logger.warn(
            `⚠️ No redemption record found for requestId: ${eventData.requestId.toString()}`,
          );
        }
      });
    } catch (error) {
      Logger.error(`Error processing RedemptionProcessing event:`, error);
    }
  }

  /**
   * Handle RedemptionFulfilled events from Ethereum
   */
  private async handleRedemptionFulfilledEvent(
    event: any,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const transactionHash = this.extractTransactionHash(event);
      if (!transactionHash) {
        Logger.error(
          `Could not extract transaction hash from ${tokenType} RedemptionFulfilled event`,
        );
        return;
      }

      const eventData: RedemptionFulfilledEventData = {
        requestId: event.args[0],
        user: event.args[1],
        amount: event.args[2],
        transactionHash,
        blockNumber: event.blockNumber || event.log?.blockNumber || 0,
        tokenAddress: event.address || event.log?.address || "",
      };

      await this.processRedemptionFulfilledEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(
        `Error processing ${tokenType} RedemptionFulfilled event log:`,
        error,
      );
    }
  }

  private async handleRedemptionCancelledEvent(
    event: any,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const transactionHash = this.extractTransactionHash(event);
      if (!transactionHash) {
        Logger.error(
          `Could not extract transaction hash from ${tokenType} RedemptionCancelled event`,
        );
        return;
      }

      const eventData: RedemptionCancelledEventData = {
        requestId: event.args[0],
        user: event.args[1],
        amount: event.args[2],
        transactionHash,
        blockNumber: event.blockNumber || event.log?.blockNumber || 0,
        tokenAddress: event.address || event.log?.address || "",
      };

      await this.processRedemptionCancelledEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(
        `Error processing ${tokenType} RedemptionCancelled event log:`,
        error,
      );
    }
  }

  private async processRedemptionFulfilledEvent(
    eventData: RedemptionFulfilledEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      Logger.info(`🎉 Processing RedemptionFulfilled event for ${tokenType}:`, {
        requestId: eventData.requestId.toString(),
        user: eventData.user,
        amount: eventData.amount.toString(),
        transactionHash: eventData.transactionHash,
      });

      // Find redemption by requestId and update status to completed
      await this.retryDatabaseOperation(async () => {
        const redemptionRecord = await storage.getRedemptionByRequestId(
          eventData.requestId.toString(),
        );

        if (redemptionRecord && redemptionRecord._id) {
          // Check if notification already sent for this event
          if (redemptionRecord.notificationStatus?.fulfilledNotified) {
            Logger.info(
              `📧 Notification already sent for completed ${tokenType} redemption:`,
              {
                requestId: eventData.requestId.toString(),
                transactionHash: eventData.transactionHash,
                fulfilledNotified:
                  redemptionRecord.notificationStatus.fulfilledNotified,
              },
            );
            return;
          }

          const fulfilledUpdateData: any = {
            status: "completed" as any,
            updatedAt: new Date(),
            completedAt: new Date(),
            transactionHash: eventData.transactionHash,
          };
          await storage.updateRedemption(
            redemptionRecord._id.toString(),
            fulfilledUpdateData,
          );

          Logger.info(`✅ Updated redemption to completed:`, {
            redemptionId: redemptionRecord._id,
            requestId: eventData.requestId.toString(),
            transactionHash: eventData.transactionHash,
            tokenType,
            amount: ethers.formatEther(eventData.amount),
          });

          // Send email notification for fulfillment
          try {
            await BlockchainEmailService.sendBlockchainEventNotification({
              eventType: "REDEMPTION_FULFILLED",
              network: "Ethereum",
              walletAddress: eventData.user,
              transactionHash: eventData.transactionHash,
              tokenType: tokenType as "GOLD" | "SILVER",
              amount: ethers.formatEther(eventData.amount),
              requestId: eventData.requestId.toString(),
            });

            // Only set notified flag AFTER successful email sending
            const notificationUpdateData: any = {
              "notificationStatus.fulfilledNotified": true,
            };
            await storage.updateRedemption(
              redemptionRecord._id.toString(),
              notificationUpdateData,
            );

            Logger.info(
              `📧 Redemption fulfilled notification sent for ${tokenType}:`,
              {
                requestId: eventData.requestId.toString(),
                transactionHash: eventData.transactionHash,
              },
            );
          } catch (emailError) {
            Logger.error(
              "Failed to send redemption fulfilled notification:",
              emailError,
            );
          }
        } else {
          Logger.warn(
            `⚠️ No redemption record found for requestId: ${eventData.requestId.toString()}`,
          );
        }
      });
    } catch (error) {
      Logger.error(`Error processing RedemptionFulfilled event:`, error);
    }
  }

  private async processRedemptionCancelledEvent(
    eventData: RedemptionCancelledEventData,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      Logger.info(`🚫 Processing RedemptionCancelled event for ${tokenType}:`, {
        requestId: eventData.requestId.toString(),
        user: eventData.user,
        amount: eventData.amount.toString(),
        transactionHash: eventData.transactionHash,
      });

      // Find redemption by requestId and update status to cancelled
      await this.retryDatabaseOperation(async () => {
        const redemptionRecord = await storage.getRedemptionByRequestId(
          eventData.requestId.toString(),
        );

        if (redemptionRecord && redemptionRecord._id) {
          // Check if notification already sent for this event
          if (redemptionRecord.notificationStatus?.cancelledNotified) {
            Logger.info(
              `📧 Notification already sent for cancelled ${tokenType} redemption:`,
              {
                requestId: eventData.requestId.toString(),
                transactionHash: eventData.transactionHash,
                cancelledNotified:
                  redemptionRecord.notificationStatus.cancelledNotified,
              },
            );
            return;
          }

          const cancelledUpdateData: any = {
            status: "cancelled" as any,
            updatedAt: new Date(),
            transactionHash: eventData.transactionHash,
          };
          await storage.updateRedemption(
            redemptionRecord._id.toString(),
            cancelledUpdateData,
          );

          Logger.info(`✅ Updated redemption to cancelled:`, {
            redemptionId: redemptionRecord._id,
            requestId: eventData.requestId.toString(),
            transactionHash: eventData.transactionHash,
            tokenType,
            amount: ethers.formatEther(eventData.amount),
          });

          // Send email notification for cancellation
          try {
            await BlockchainEmailService.sendBlockchainEventNotification({
              eventType: "REDEMPTION_CANCEL",
              network: "Ethereum",
              walletAddress: eventData.user,
              transactionHash: eventData.transactionHash,
              tokenType: tokenType as "GOLD" | "SILVER",
              amount: ethers.formatEther(eventData.amount),
              requestId: eventData.requestId.toString(),
            });

            // Only set notified flag AFTER successful email sending
            const notificationUpdateData: any = {
              "notificationStatus.cancelledNotified": true,
            };
            await storage.updateRedemption(
              redemptionRecord._id.toString(),
              notificationUpdateData,
            );

            Logger.info(
              `📧 Redemption cancelled notification sent for ${tokenType}:`,
              {
                requestId: eventData.requestId.toString(),
                transactionHash: eventData.transactionHash,
              },
            );
          } catch (emailError) {
            Logger.error(
              "Failed to send redemption cancelled notification:",
              emailError,
            );
          }
        } else {
          Logger.warn(
            `⚠️ No redemption record found for requestId: ${eventData.requestId.toString()}`,
          );
        }
      });
    } catch (error) {
      Logger.error(`Error processing RedemptionCancelled event:`, error);
    }
  }

  stopListening() {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;

    try {
      // Clean up all event handlers
      for (const handler of this.eventHandlers) {
        handler.contract.removeListener(
          "TransferWithFee",
          handler.transferHandler,
        );
        handler.contract.removeListener(
          "Transfer",
          handler.standardTransferHandler,
        );
        handler.contract.removeListener(
          "RedemptionRequested",
          handler.redemptionHandler,
        );
        handler.contract.removeListener(
          "TokensMinted",
          handler.tokensMintedHandler,
        );
        handler.contract.removeListener(
          "RedemptionProcessing",
          handler.redemptionProcessingHandler,
        );
        handler.contract.removeListener(
          "RedemptionFulfilled",
          handler.redemptionFulfilledHandler,
        );
      }

      this.eventHandlers = [];
      Logger.info("Stopped blockchain event listener");
    } catch (error) {
      Logger.error("Error stopping blockchain listener:", error);
    }
  }

  getStatus() {
    const tokenStatuses = Object.entries(this.tokenConfigs).reduce(
      (acc, [type, config]) => {
        acc[`has${type}Contract`] = !!config?.contract;
        acc[`${type.toLowerCase()}ContractAddress`] =
          config?.contract?.target || null;
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      isListening: this.isListening,
      hasProvider: !!this.provider,
      activeHandlers: this.eventHandlers.length,
      ...tokenStatuses,
    };
  }

  // Method to update token prices dynamically
  updateTokenPrices(goldPrice?: number, silverPrice?: number) {
    if (goldPrice && this.tokenConfigs.GOLD) {
      this.tokenConfigs.GOLD.price = goldPrice;
    }
    if (silverPrice && this.tokenConfigs.SILVER) {
      this.tokenConfigs.SILVER.price = silverPrice;
    }
    Logger.info("Updated token prices", { goldPrice, silverPrice });
  }

  /**
   * Handle standard Transfer events from Ethereum (including regular transfers and gifts)
   */
  private async handleStandardTransferEvent(
    event: any,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const transactionHash = this.extractTransactionHash(event);
      if (!transactionHash) {
        Logger.error(
          `Could not extract transaction hash from ${tokenType} Transfer event`,
        );
        return;
      }

      // Standard Transfer event signature: Transfer(address from, address to, uint256 value)
      const eventData = {
        from: event.args[0], // address from
        to: event.args[1], // address to
        value: event.args[2], // uint256 value
        transactionHash,
        blockNumber: event.blockNumber || event.log?.blockNumber || 0,
        tokenAddress: event.address || event.log?.address || "",
      };

      Logger.info(`💰 Standard Transfer Event Detected for ${tokenType}:`, {
        from: eventData.from,
        to: eventData.to,
        value: ethers.formatEther(eventData.value),
        transactionHash: eventData.transactionHash,
        blockNumber: eventData.blockNumber,
      });

      await this.processStandardTransferEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(`Error processing ${tokenType} Transfer event log:`, error);
    }
  }

  private async processStandardTransferEvent(
    eventData: any,
    tokenType: "GOLD" | "SILVER",
  ) {
    try {
      const tokenAmount = ethers.formatEther(eventData.value);

      Logger.info(`🔄 Processing Standard Transfer event for ${tokenType}:`, {
        from: eventData.from,
        to: eventData.to,
        amount: tokenAmount,
        transactionHash: eventData.transactionHash,
      });

      // Check if this is a mint transaction (from zero address)
      const isFromZeroAddress = eventData.from === ethers.ZeroAddress;
      if (isFromZeroAddress) {
        Logger.info(
          `🎯 Transfer from zero address detected - treating as mint for ${tokenType}`,
        );
        // Process as mint event
        await this.processTokensMintedEvent(
          {
            to: eventData.to,
            amount: eventData.value,
            controller: "0x0000000000000000000000000000000000000000", // Default controller for standard transfers
            transactionHash: eventData.transactionHash,
            blockNumber: eventData.blockNumber,
            tokenAddress: eventData.tokenAddress,
          },
          tokenType,
        );
        return;
      }

      // Check if this is a gifting transaction
      const existingGifting = await storage.getGiftingByTransactionHash(
        eventData.transactionHash,
      );

      if (existingGifting) {
        Logger.info(
          `📦 Standard Transfer matched existing gifting record for ${tokenType}:`,
          {
            from: eventData.from,
            to: eventData.to,
            amount: tokenAmount,
            giftingId: existingGifting._id,
          },
        );

        // For gifting transactions, still send notifications if not already sent
        await this.processGiftingTransferNotifications(
          eventData,
          tokenType,
          existingGifting,
        );
        return;
      }

      // This is a regular transfer - send notifications to both sender and recipient
      Logger.info(
        `📋 Regular Transfer detected for ${tokenType} (no associated purchase/gift):`,
        {
          from: eventData.from,
          to: eventData.to,
          amount: tokenAmount,
          transactionHash: eventData.transactionHash,
        },
      );

      // Check if notifications already exist for this transaction
      let transferNotification = await (
        storage as any
      ).getTransferNotificationByHash(eventData.transactionHash);

      if (!transferNotification) {
        // Create transfer notification record
        try {
          transferNotification = await (
            storage as any
          ).createTransferNotification({
            transactionHash: eventData.transactionHash,
            tokenType: tokenType,
            network: "Ethereum",
            fromAddress: eventData.from,
            toAddress: eventData.to,
            amount: tokenAmount,
            blockNumber: eventData.blockNumber,
          });
          Logger.info(
            `📝 Created transfer notification record for ${tokenType} transaction`,
          );
        } catch (error) {
          Logger.error(`Failed to create transfer notification record:`, error);
        }
      }

      // Send notification to recipient if not already sent
      if (transferNotification && !transferNotification.recipientNotified) {
        try {
          await BlockchainEmailService.sendBlockchainEventNotification({
            eventType: "TRANSFER",
            network: "Ethereum",
            walletAddress: eventData.to,
            transactionHash: eventData.transactionHash,
            tokenType: tokenType,
            amount: tokenAmount,
            blockNumber: eventData.blockNumber,
            fromAddress: eventData.from,
            toAddress: eventData.to,
            isSender: false,
          });

          // Mark recipient as notified
          await (storage as any).markRecipientNotified(
            eventData.transactionHash,
          );
          Logger.info(
            `📧 Transfer notification sent to recipient for ${tokenType}: ${eventData.to}`,
          );
        } catch (emailError) {
          Logger.warn(
            `Failed to send transfer notification to recipient:`,
            emailError,
          );
        }
      }

      // Send notification to sender if not already sent
      if (transferNotification && !transferNotification.senderNotified) {
        try {
          await BlockchainEmailService.sendBlockchainEventNotification({
            eventType: "TRANSFER",
            network: "Ethereum",
            walletAddress: eventData.from,
            transactionHash: eventData.transactionHash,
            tokenType: tokenType,
            amount: tokenAmount,
            blockNumber: eventData.blockNumber,
            fromAddress: eventData.from,
            toAddress: eventData.to,
            isSender: true,
          });

          // Mark sender as notified
          await (storage as any).markSenderNotified(eventData.transactionHash);
          Logger.info(
            `📧 Transfer notification sent to sender for ${tokenType}: ${eventData.from}`,
          );
        } catch (emailError) {
          Logger.warn(
            `Failed to send transfer notification to sender:`,
            emailError,
          );
        }
      }
    } catch (error) {
      Logger.error(`Error processing standard Transfer event:`, error);
    }
  }

  /**
   * Process transfer notifications for gifting transactions
   */
  private async processGiftingTransferNotifications(
    eventData: any,
    tokenType: "GOLD" | "SILVER",
    existingGifting: any,
  ) {
    try {
      const tokenAmount = ethers.formatEther(eventData.value);

      // Check if notifications already exist for this transaction
      let transferNotification = await (
        storage as any
      ).getTransferNotificationByHash(eventData.transactionHash);

      if (!transferNotification) {
        // Create transfer notification record for gifting
        try {
          transferNotification = await (
            storage as any
          ).createTransferNotification({
            transactionHash: eventData.transactionHash,
            tokenType: tokenType,
            network: "Ethereum",
            fromAddress: eventData.from,
            toAddress: eventData.to,
            amount: tokenAmount,
            blockNumber: eventData.blockNumber,
          });
          Logger.info(
            `📝 Created transfer notification record for ${tokenType} gifting transaction`,
          );
        } catch (error) {
          Logger.error(
            `Failed to create gifting transfer notification record:`,
            error,
          );
          return;
        }
      }

      // Send notification to gift recipient if not already sent
      if (!transferNotification.recipientNotified) {
        try {
          await BlockchainEmailService.sendBlockchainEventNotification({
            eventType: "TRANSFER",
            network: "Ethereum",
            walletAddress: eventData.to,
            transactionHash: eventData.transactionHash,
            tokenType: tokenType,
            amount: tokenAmount,
            blockNumber: eventData.blockNumber,
            fromAddress: eventData.from,
            toAddress: eventData.to,
            isSender: false,
          });

          // Mark recipient as notified
          await (storage as any).markRecipientNotified(
            eventData.transactionHash,
          );
          Logger.info(
            `🎁 Gift recipient notification sent for ${tokenType}: ${eventData.to}`,
          );
        } catch (emailError) {
          Logger.warn(
            `Failed to send gift recipient notification:`,
            emailError,
          );
        }
      }

      // Send notification to gift sender if not already sent
      if (!transferNotification.senderNotified) {
        try {
          await BlockchainEmailService.sendBlockchainEventNotification({
            eventType: "TRANSFER",
            network: "Ethereum",
            walletAddress: eventData.from,
            transactionHash: eventData.transactionHash,
            tokenType: tokenType,
            amount: tokenAmount,
            blockNumber: eventData.blockNumber,
            fromAddress: eventData.from,
            toAddress: eventData.to,
            isSender: true,
          });

          // Mark sender as notified
          await (storage as any).markSenderNotified(eventData.transactionHash);
          Logger.info(
            `🎁 Gift sender notification sent for ${tokenType}: ${eventData.from}`,
          );
        } catch (emailError) {
          Logger.warn(`Failed to send gift sender notification:`, emailError);
        }
      }
    } catch (error) {
      Logger.error(`Error processing gifting transfer notifications:`, error);
    }
  }
}

// Create and export singleton instance
export const blockchainListener = new BlockchainListener();
