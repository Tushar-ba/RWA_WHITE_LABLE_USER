import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';
import { storage } from '../storage/index.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { ethers } from 'ethers';
import { NotificationService } from '../services/notification.service.js';

// Contract addresses for different token types
const CONTRACT_ADDRESSES = {
  gold: process.env.EVM_GOLD_TOKEN_CONTRACT,
  silver: process.env.EVM_SILVER_TOKEN_CONTRACT
} as const;

// USD to ETH conversion rate
const USD_TO_ETH_RATE = 0.00028;

// Validation schema - updated to match frontend payload
const mintRequestSchema = z.object({
  tokenType: z.enum(['gold', 'silver'], {
    errorMap: () => ({ message: 'Token type must be either "gold" or "silver"' })
  }),
  amountInUsd: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid USD amount with up to 2 decimal places'),
  walletAddress: z.string().optional(), // Made optional for private networks
  network: z.enum(['public', 'private', 'solana'], {
    errorMap: () => ({ message: 'Network must be one of: public, private, solana' })
  }).optional().default('public'),
  currentTokenPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Current token price must be a valid USD amount with up to 2 decimal places')
}).refine((data) => {
  // For private networks, wallet address is not required
  if (data.network === 'private') {
    return true;
  }
  // For public/solana networks, wallet address is required and must be valid format
  return data.walletAddress && data.walletAddress.length >= 32;
}, {
  message: 'Wallet address is required for public and Solana networks',
  path: ['walletAddress']
});

export type MintTokenRequest = z.infer<typeof mintRequestSchema>;

// Validated request type
interface ValidatedRequest<T> extends Request {
  validated: T;
}

// Validation middleware
export const validateMintTokenRequest = (req: Request, res: Response, next: Function) => {
  try {
    const validated = mintRequestSchema.parse(req.body);
    (req as ValidatedRequest<MintTokenRequest>).validated = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    return res.status(400).json({ message: 'Invalid request data' });
  }
};

export class MintController {
  /**
   * Process mint from purchase history (used for automatic minting after payment)
   */
  static async mintFromPurchaseHistory(purchaseHistory: any): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      const { userId, metal, usdAmount, walletAddress, networkType } = purchaseHistory;
      
      console.log(`[AUTO-MINT] Processing automatic mint for purchase: ${purchaseHistory._id}`);
      console.log(`- Token Type: ${metal}`);
      console.log(`- Amount USD: $${usdAmount}`);
      console.log(`- User Wallet: ${walletAddress}`);
      console.log(`- Network: ${networkType}`);

      // Validate wallet address format based on network
      if (!MintController.isValidWalletAddress(walletAddress, networkType)) {
        throw new Error(`Invalid wallet address format for ${networkType} network`);
      }

      // Convert USD to ETH
      const amountUsd = parseFloat(usdAmount);
      const ethAmount = MintController.convertUsdToEth(amountUsd);
      console.log(`- ETH Amount: ${ethAmount} ETH`);

      // Convert ETH to Wei
      const weiAmount = MintController.convertEthToWei(ethAmount);
      console.log(`- Wei Amount: ${weiAmount} wei`);

      // Get contract address for token type
      const contractAddress = MintController.getContractAddress(metal as 'gold' | 'silver');
      console.log(`- Contract Address: ${contractAddress}`);

      // Simulate blockchain transaction (replace with actual blockchain call when ready)
      // const result = await BlockchainService.mint(contractAddress, walletAddress, weiAmount);
      
      // For now, simulate success with mock transaction hash
      const mockTransactionHash = networkType === 'private' 
        ? 'canton_mint_success' 
        : `0x${Date.now().toString(16)}mock${Math.random().toString(36).substr(2, 8)}`;
      
      console.log(`✅ Auto-mint successful for ${metal} tokens`);
      console.log(`- Transaction Hash: ${mockTransactionHash}`);

      // Update purchase history with success status and transaction hash
      await storage.updatePurchaseHistory(purchaseHistory._id.toString(), {
        status: 'completed',
        transactionHash: mockTransactionHash,
        tokensMinted: true,
        updatedAt: new Date()
      });

      // Send notification
      try {
        await NotificationService.createNotification({
          userId,
          type: 'token_purchase',
          title: `${metal.charAt(0).toUpperCase() + metal.slice(1)} Tokens Minted`,
          message: `Successfully minted ${ethAmount} ${metal.toUpperCase()} tokens to your wallet ${walletAddress}`,
          data: {
            metal,
            amount: ethAmount,
            usdValue: usdAmount,
            transactionHash: mockTransactionHash,
            walletAddress
          }
        });
        console.log(`✅ Notification created for auto-mint: ${purchaseHistory._id}`);
      } catch (notificationError) {
        console.error('Error creating notification for auto-mint:', notificationError);
      }

      return { 
        success: true, 
        transactionHash: mockTransactionHash 
      };

    } catch (error: any) {
      console.error(`❌ Auto-mint failed for purchase ${purchaseHistory._id}:`, error);
      
      // Update purchase history with failed status
      await storage.updatePurchaseHistory(purchaseHistory._id.toString(), {
        status: 'failed',
        errorMessage: `Minting failed: ${error.message}`,
        updatedAt: new Date()
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  /**
   * Validate wallet address based on network type
   */
  private static isValidWalletAddress(address: string, network: string): boolean {
    if (network === 'solana') {
      // Solana addresses are base58 encoded and typically 32-44 characters
      // This is a basic validation - you might want to use a Solana library for more robust validation
      const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      return solanaAddressRegex.test(address);
    } else {
      // For Ethereum networks (public/private), use ethers validation
      return ethers.isAddress(address);
    }
  }

  /**
   * Convert USD to ETH
   */
  private static convertUsdToEth(amountUsd: number): string {
    const ethAmount = amountUsd * USD_TO_ETH_RATE;
    // Round to 8 decimal places to avoid precision issues
    return ethAmount.toFixed(8);
  }

  /**
   * Convert ETH to Wei
   */
  private static convertEthToWei(ethAmount: string): string {
    try {
      // Parse the ETH amount as a number and ensure it's valid
      const ethNumber = parseFloat(ethAmount);
      if (isNaN(ethNumber) || ethNumber <= 0) {
        throw new Error('Invalid ETH amount: must be a positive number');
      }
      
      // Convert to fixed decimal places to avoid precision issues
      const formattedEthAmount = ethNumber.toFixed(8);
      console.log(`Converting ${formattedEthAmount} ETH to wei`);
      
      return ethers.parseEther(formattedEthAmount).toString();
    } catch (error) {
      console.error('ETH to Wei conversion error:', error);
      throw new Error(`Invalid ETH amount for conversion to wei: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get contract address for token type
   */
  private static getContractAddress(tokenType: 'gold' | 'silver'): string {
    return CONTRACT_ADDRESSES[tokenType];
  }

  /**
   * Mint tokens based on USD amount and token type
   */
  static async mintTokens(req: ValidatedRequest<MintTokenRequest>, res: Response): Promise<void> {
    try {
      const { tokenType, amountInUsd, walletAddress, network, currentTokenPrice } = req.validated;
      const userId = (req as unknown as AuthenticatedRequest).user?.user_id;

      // Convert string amount to number
      const amountUsd = parseFloat(amountInUsd);
      
      // Get platform fee from database
      const platformFeeConfig = await storage.getPlatformFee();
      const platformFeePercent = platformFeeConfig?.percentage || 0;
      const platformFee = platformFeePercent / 100; // Convert percentage to decimal
      const feeAmount = amountUsd * platformFee;
      const netAmount = amountUsd - feeAmount;
      
      // Get dynamic token conversion values from environment
      const mgPerToken = tokenType === 'gold' 
        ? parseInt(process.env.GOLD_MG_PER_TOKEN || '10')
        : parseInt(process.env.SILVER_MG_PER_TOKEN || '10');
        
      // Calculate actual token amount based on net USD amount and current price
      const pricePerGram = parseFloat(currentTokenPrice);
      const pricePerMg = pricePerGram / 1000;
      const pricePerToken = pricePerMg * mgPerToken;
      const actualTokenAmount = netAmount / pricePerToken;
      
      // Get current date and time
      const now = new Date();
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toTimeString().split(' ')[0]; // HH:MM:SS

      console.log(`[MINT] Processing mint request:`);
      console.log(`- Token Type: ${tokenType}`);
      console.log(`- Amount USD: $${amountUsd}`);
      console.log(`- User Wallet: ${walletAddress}`);
      console.log(`- Network: ${network}`);

      // Validate wallet address format based on network (skip for private networks)
      if (network !== 'private' && walletAddress && !MintController.isValidWalletAddress(walletAddress, network)) {
        res.status(400).json({
          message: `Invalid wallet address format for ${network} network`
        });
        return;
      }

      // Convert USD to ETH
      const ethAmount = MintController.convertUsdToEth(amountUsd);
      console.log(`- ETH Amount: ${ethAmount} ETH`);

      // Convert ETH to Wei
      const weiAmount = MintController.convertEthToWei(ethAmount);
      console.log(`- Wei Amount: ${weiAmount} wei`);

      // Get contract address for token type
      const contractAddress = MintController.getContractAddress(tokenType);
      console.log(`- Contract Address: ${contractAddress}`);

      // Call blockchain mint function with default gas settings
      // const result = await BlockchainService.mint(
      //   contractAddress,
      //   walletAddress,
      //   weiAmount
      // );

      // if (result.success) {
      //   console.log(`✅ Mint successful for ${tokenType} tokens`);
        
        // Store successful purchase history record
        if (userId) {
          try {
            const purchaseRecord = await storage.createPurchaseHistory({
              userId,
              metal: tokenType,
              tokenAmount: actualTokenAmount.toFixed(6), // Store calculated token amount based on mg conversion
              usdAmount: amountInUsd,
              feeAmount: feeAmount.toFixed(2),
              date,
              time,
              status: 'pending',
              networkType: network, // Use network from request
              paymentMethod: 'wallet',
              transactionHash: '',
              walletAddress: walletAddress || '', // Use empty string for private networks
              currentTokenPrice // Include the current token price from request
            });
            console.log(`📝 Purchase history record created for user ${userId}`);

            // Create notification for SUPPLY_CONTROLLER_ROLE on successful token purchase
            try {
              const userInfo = await storage.getUserInfo(userId);
              if (userInfo && purchaseRecord) {
                // Use existing database connection from storage
                const notification = {
                  type: 'buyToken',
                  title: `New Token Purchase - ${purchaseRecord.metal?.toUpperCase()}`,
                  message: `User ${userInfo.name || 'User'} has purchased ${purchaseRecord.tokenAmount} ${purchaseRecord.metal?.toUpperCase()} tokens for $${purchaseRecord.usdAmount} via ${purchaseRecord.networkType} network.`,
                  relatedId: purchaseRecord._id?.toString(),
                  priority: 'normal',                 
                  targetRoles: ['SUPPLY_CONTROLLER_ROLE','DEFAULT_ADMIN_ROLE'],
                  isRead: false,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };

                await (storage as any).db.collection('notifications').insertOne(notification);
                console.log('✅ Notification created for token purchase:', purchaseRecord._id);
              }
            } catch (notificationError) {
              console.error('⚠️ Failed to create purchase notification (non-blocking):', notificationError);
              // Don't fail the API call if notification creation fails
            }
          } catch (historyError) {
            console.error('Failed to create purchase history record or update portfolio:', historyError);
            // Don't fail the mint operation if history creation fails
          }
        }
        
        res.status(200).json({
          message: `Successfully minted ${tokenType} tokens`,
          details: {
            tokenType,
            amountUsd,
            ethAmount,
            weiAmount,
            userWallet: walletAddress || 'N/A (Private Network)',
            contractAddress,
            transactionHash: 'mock_tx_hash_' + Date.now(),
            gasUsed: 21000,
            blockNumber: 123456
          }
        });
      // } else {
      //   console.error(`❌ Mint failed for ${tokenType} tokens:`, result.error);
        
      //   // Store failed purchase history record
      //   if (userId) {
      //     try {
      //       await storage.createPurchaseHistory({
      //         userId,
      //         metal: tokenType,
      //         tokenAmount: '0', // No tokens received
      //         usdAmount: amountInUsd,
      //         feeAmount: feeAmount.toFixed(2),
      //         date,
      //         time,
      //         status: 'failed',
      //         networkType: 'public',
      //         paymentMethod: 'wallet',
      //         walletAddress,
      //         errorMessage: result.error
      //       });
      //       console.log(`📝 Failed purchase history record created for user ${userId}`);
      //     } catch (historyError) {
      //       console.error('Failed to create purchase history record:', historyError);
      //     }
      //   }
        
      //   res.status(400).json({
      //     message: `Failed to mint ${tokenType} tokens`,
      //     error: result.error,
      //     details: {
      //       tokenType,
      //       amountUsd,
      //       ethAmount,
      //       userWallet: walletAddress,
      //       contractAddress
      //     }
      //   });
      // }

    } catch (error: any) {
      console.error('Mint controller error:', error);
      
      res.status(500).json({
        message: 'Internal server error during mint operation',
        error: error.message || 'Unknown error occurred'
      });
    }
  }

  /**
   * Get conversion rate and estimate costs
   */
  static async getConversionEstimate(req: Request, res: Response): Promise<void> {
    try {
      const { amountUsd } = req.query;

      if (!amountUsd || isNaN(Number(amountUsd))) {
        res.status(400).json({
          message: 'Valid amountUsd query parameter is required'
        });
        return;
      }

      const usdAmount = Number(amountUsd);
      const ethAmount = MintController.convertUsdToEth(usdAmount);
      const weiAmount = MintController.convertEthToWei(ethAmount);

      res.status(200).json({
        conversion: {
          usdAmount,
          ethAmount,
          weiAmount,
          conversionRate: USD_TO_ETH_RATE
        },
        contracts: CONTRACT_ADDRESSES
      });

    } catch (error: any) {
      console.error('Conversion estimate error:', error);
      
      res.status(500).json({
        message: 'Failed to calculate conversion estimate',
        error: error.message || 'Unknown error occurred'
      });
    }
  }
}