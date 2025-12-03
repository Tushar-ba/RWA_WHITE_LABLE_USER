import { ethers } from 'ethers';
import { storage } from '../storage/index.js';
import { Logger } from '../utils/logger.js';

// Contract ABIs - TransferWithFee event structure
const TransferWithFeeEvent = [
  "event TransferWithFee(address indexed from, address indexed to, uint256 value, uint256 fee)"
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

export class BlockchainListener {
  private provider: ethers.JsonRpcProvider | null = null;
  private goldContract: ethers.Contract | null = null;
  private silverContract: ethers.Contract | null = null;
  private isListening = false;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      // Use a public RPC endpoint or configure your own
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-holesky.g.alchemy.com/v2/EdUntStbXZaSHzY-svGENPy8lkmOh5l2';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      const goldTokenAddress = process.env.GOLD_TOKEN_CONTRACT?.trim();
      const silverTokenAddress = process.env.SILVER_TOKEN_CONTRACT?.trim();

      if (goldTokenAddress) {
        this.goldContract = new ethers.Contract(
          goldTokenAddress,
          TransferWithFeeEvent,
          this.provider
        );
      }

      if (silverTokenAddress) {
        this.silverContract = new ethers.Contract(
          silverTokenAddress,
          TransferWithFeeEvent,
          this.provider
        );
      }

      Logger.info('Blockchain listener initialized');
    } catch (error) {
      Logger.error('Failed to initialize blockchain listener:', error);
    }
  }

  async startListening() {
    if (this.isListening || !this.provider) {
      return;
    }

    this.isListening = true;
    Logger.info('Starting blockchain event listener for TransferWithFee events');

    try {
      // Get current block number to process recent events
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100); // Process last 100 blocks
      
      Logger.info(`Processing events from block ${fromBlock} to ${currentBlock}`);

      // Process historical events first
      await this.processHistoricalEvents(fromBlock, currentBlock);

      // Then set up real-time listeners
      await this.setupRealtimeListeners();

    } catch (error) {
      Logger.error('Error setting up blockchain listeners:', error);
      this.isListening = false;
    }
  }

  private async processHistoricalEvents(fromBlock: number, toBlock: number) {
    try {
      // Process Gold token events
      if (this.goldContract) {
        const goldEvents = await this.goldContract.queryFilter('TransferWithFee', fromBlock, toBlock);
        Logger.info(`Found ${goldEvents.length} historical Gold TransferWithFee events`);
        
        for (const event of goldEvents) {
          await this.processEventLog(event, 'GOLD');
        }
      }

      // Process Silver token events
      if (this.silverContract) {
        const silverEvents = await this.silverContract.queryFilter('TransferWithFee', fromBlock, toBlock);
        Logger.info(`Found ${silverEvents.length} historical Silver TransferWithFee events`);
        
        for (const event of silverEvents) {
          await this.processEventLog(event, 'SILVER');
        }
      }
    } catch (error) {
      Logger.error('Error processing historical events:', error);
    }
  }

  private async setupRealtimeListeners() {
    try {
      // Listen for Gold token TransferWithFee events
      if (this.goldContract) {
        this.goldContract.on('TransferWithFee', async (from, to, value, fee, event) => {
          try {
            Logger.info('Real-time Gold TransferWithFee event detected');
            await this.processEventLog(event, 'GOLD');
          } catch (error) {
            Logger.error('Error processing real-time Gold TransferWithFee event:', error);
          }
        });
      }

      // Listen for Silver token TransferWithFee events
      if (this.silverContract) {
        this.silverContract.on('TransferWithFee', async (from, to, value, fee, event) => {
          try {
            Logger.info('Real-time Silver TransferWithFee event detected');
            await this.processEventLog(event, 'SILVER');
          } catch (error) {
            Logger.error('Error processing real-time Silver TransferWithFee event:', error);
          }
        });
      }
    } catch (error) {
      Logger.error('Error setting up real-time listeners:', error);
    }
  }

  private async processEventLog(event: any, tokenType: 'GOLD' | 'SILVER') {
    try {
      const eventData: TransferWithFeeEventData = {
        from: event.args[0],
        to: event.args[1],
        value: event.args[2],
        fee: event.args[3],
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        tokenAddress: event.address
      };

      await this.processTransferEvent(eventData, tokenType);
    } catch (error) {
      Logger.error(`Error processing ${tokenType} event log:`, error);
    }
  }

  private async processTransferEvent(eventData: TransferWithFeeEventData, tokenType: 'GOLD' | 'SILVER') {
    try {
      Logger.info(`Processing TransferWithFee event for ${tokenType}:`, {
        from: eventData.from,
        to: eventData.to,
        value: eventData.value.toString(),
        fee: eventData.fee.toString(),
        transactionHash: eventData.transactionHash
      });

      // Check if this transaction already exists in our gifting records
      const existingGifting = await storage.getGiftingByTransactionHash(eventData.transactionHash);
      
      if (existingGifting) {
        Logger.info(`Gifting record already exists for transaction ${eventData.transactionHash}`);
        return;
      }

      // Convert Wei to token amount (assuming 18 decimals)
      const tokenAmount = ethers.formatEther(eventData.value);
      const feeAmount = ethers.formatEther(eventData.fee);

      // Calculate values based on token type
      const tokenValues = {
        GOLD: { gramsPerToken: 1, price: 65.5 },
        SILVER: { gramsPerToken: 31.1, price: 0.85 }
      };

      const tokenInfo = tokenValues[tokenType];
      const gramsAmount = (parseFloat(tokenAmount) * tokenInfo.gramsPerToken).toString();
      const tokenValueUSD = (parseFloat(tokenAmount) * tokenInfo.price).toString();
      const networkFee = (parseFloat(feeAmount) * tokenInfo.price).toString(); // Approximate fee in USD
      const totalCostUSD = (parseFloat(tokenValueUSD) + parseFloat(networkFee)).toString();

      // Create gifting record from blockchain event
      // Note: We don't have the sender's userId from the blockchain event
      // This is a limitation - we'll create a record with a placeholder userId
      const giftingData = {
        userId: 'blockchain-event', // Placeholder - ideally should be resolved from wallet mapping
        recipientWallet: eventData.to,
        token: tokenType,
        quantity: tokenAmount,
        message: 'Auto-created from blockchain event',
        network: 'Ethereum' as const,
        status: 'success' as const,
        transactionHash: eventData.transactionHash,
        networkFee,
        tokenValueUSD,
        totalCostUSD,
        gramsAmount
      };

      const gifting = await storage.createGifting(giftingData);
      
      Logger.info(`Created gifting record from blockchain event:`, {
        giftingId: gifting.id,
        transactionHash: eventData.transactionHash,
        tokenType,
        amount: tokenAmount
      });

    } catch (error) {
      Logger.error('Error processing TransferWithFee event:', error);
    }
  }

  stopListening() {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;
    
    try {
      if (this.goldContract) {
        this.goldContract.removeAllListeners('TransferWithFee');
      }
      
      if (this.silverContract) {
        this.silverContract.removeAllListeners('TransferWithFee');
      }
      
      Logger.info('Stopped blockchain event listener');
    } catch (error) {
      Logger.error('Error stopping blockchain listener:', error);
    }
  }

  getStatus() {
    return {
      isListening: this.isListening,
      hasProvider: !!this.provider,
      hasGoldContract: !!this.goldContract,
      hasSilverContract: !!this.silverContract
    };
  }
}

// Export singleton instance
export const blockchainListener = new BlockchainListener();