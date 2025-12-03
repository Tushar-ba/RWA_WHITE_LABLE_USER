import { SendGridEmailService } from './sendgrid.service.js';
import { storage } from '../storage/index.js';
// Simple logger utility if not available
const Logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args),
};

export interface BlockchainEventNotification {
  eventType: 'REQUEST_REDEMPTION' | 'REDEMPTION_CANCEL' | 'TRANSFER' | 'MINT' | 'REDEMPTION_PROCESSING' | 'REDEMPTION_FULFILLED';
  network: 'Ethereum' | 'Solana';
  walletAddress: string;
  transactionHash: string;
  tokenType: 'GOLD' | 'SILVER';
  amount?: string;
  requestId?: string;
  fromAddress?: string;
  toAddress?: string;
  blockNumber?: number;
  slot?: number;
  isSender?: boolean;
}

export class BlockchainEmailService {
  
  /**
   * Send email notification for blockchain events
   */
  static async sendBlockchainEventNotification(event: BlockchainEventNotification): Promise<void> {
    try {
      Logger.info(`Sending blockchain event notification for ${event.eventType} on ${event.network}`);
      
      // Get user by wallet address
      const userId = await storage.getUserIdByWalletAddress(event.walletAddress);
      if (!userId) {
        Logger.warn(`No user found for wallet address: ${event.walletAddress}`);
        return;
      }

      // Get user details for email
      const user = await storage.getUser(userId);
      if (!user || !user.email) {
        Logger.warn(`No email found for user: ${userId}`);
        return;
      }

      const { subject, content } = this.generateEmailContent(event, user.first_name || 'User');
      
      // Send email notification
      await SendGridEmailService.sendBlockchainEventEmail(
        user.email,
        user.first_name || 'User',
        subject,
        content,
        event
      );

      Logger.info(`Blockchain event email sent to ${user.email} for ${event.eventType}`);
      
    } catch (error) {
      Logger.error('Error sending blockchain event notification:', error);
    }
  }

  /**
   * Generate email content for different blockchain events
   */
  private static generateEmailContent(event: BlockchainEventNotification, userName: string): { subject: string; content: string } {
    const tokenSymbol = event.tokenType === 'GOLD' ? 'GRT' : 'SRT';
    const tokenName = event.tokenType === 'GOLD' ? 'Gold Reserve Token' : 'Silver Reserve Token';
    
    switch (event.eventType) {
      case 'REQUEST_REDEMPTION':
        return {
          subject: `${tokenName} Redemption Request`,
          content: `Your redemption request for ${event.amount || 'N/A'} ${tokenSymbol} tokens has been confirmed on the ${event.network} blockchain. Request ID: ${event.requestId || 'N/A'}. Transaction: ${event.transactionHash}`
        };
        
      case 'REDEMPTION_CANCEL':
        return {
          subject: `${tokenName} Redemption Cancelled`,
          content: `Your redemption request (ID: ${event.requestId || 'N/A'}) for ${tokenSymbol} tokens has been cancelled on the ${event.network} blockchain. Transaction: ${event.transactionHash}`
        };
        
      case 'TRANSFER':
        const transferRole = event.isSender !== false && event.walletAddress === event.fromAddress ? 'sender' : 'recipient';
        if (transferRole === 'sender') {
          return {
            subject: `${tokenName} Transfer Sent Successfully`,
            content: `You have successfully sent ${event.amount || 'N/A'} ${tokenSymbol} tokens to ${event.toAddress || 'N/A'} on the ${event.network} blockchain. Transaction: ${event.transactionHash}`
          };
        } else {
          return {
            subject: `${tokenName} Transfer Received`,
            content: `You have received ${event.amount || 'N/A'} ${tokenSymbol} tokens from ${event.fromAddress || 'N/A'} on the ${event.network} blockchain. Transaction: ${event.transactionHash}`
          };
        }
        
      case 'MINT':
        return {
          subject: `${tokenName} Tokens Minted`,
          content: `${event.amount || 'N/A'} ${tokenSymbol} tokens have been minted to your address on the ${event.network} blockchain. Transaction: ${event.transactionHash}`
        };
        
      case 'REDEMPTION_PROCESSING':
        return {
          subject: `${tokenName} Redemption Being Processed`,
          content: `Your redemption request (ID: ${event.requestId || 'N/A'}) for ${tokenSymbol} tokens is now being processed. Transaction: ${event.transactionHash}`
        };
        
      case 'REDEMPTION_FULFILLED':
        return {
          subject: `${tokenName} Redemption Fulfilled`,
          content: `Your redemption request (ID: ${event.requestId || 'N/A'}) for ${tokenSymbol} tokens has been fulfilled. Physical ${event.tokenType.toLowerCase()} will be shipped to your delivery address. Transaction: ${event.transactionHash}`
        };
        
      default:
        return {
          subject: `${tokenName} Blockchain Event`,
          content: `A blockchain event has occurred for your ${tokenSymbol} tokens on ${event.network}. Transaction: ${event.transactionHash}`
        };
    }
  }
}