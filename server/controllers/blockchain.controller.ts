import { Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';
import { z } from 'zod';

// Validation schemas
const mintSchema = z.object({
  contractAddress: z.string().min(42, 'Invalid contract address'),
  toAddress: z.string().min(42, 'Invalid recipient address'),
  amount: z.string().min(1, 'Amount is required'),
  gasLimit: z.string().optional(),
  gasPrice: z.string().optional()
});

const transactionStatusSchema = z.object({
  txHash: z.string().min(66, 'Invalid transaction hash')
});

export type MintRequest = z.infer<typeof mintSchema>;
export type TransactionStatusRequest = z.infer<typeof transactionStatusSchema>;

// Validated request type
interface ValidatedRequest<T> extends Request {
  validated: T;
}

// Validation middleware
const validateRequest = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      const validated = schema.parse(req.body);
      (req as ValidatedRequest<T>).validated = validated;
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
};

export class BlockchainController {
  /**
   * Execute mint function on blockchain
   */
  static async mint(req: ValidatedRequest<MintRequest>, res: Response): Promise<void> {
    try {
      console.log(req)
      const { contractAddress, toAddress, amount } = req.validated;

      console.log(`[BLOCKCHAIN] Mint request received:`);
      console.log(`- Contract: ${contractAddress}`);
      console.log(`- To: ${toAddress}`);
      console.log(`- Amount: ${amount}`);

      const result = await BlockchainService.mint(
        contractAddress,
        toAddress,
        amount       
      );
      console.log(result)
      if (result.success) {
        res.status(200).json({
          message: 'Mint transaction successful',
          transactionHash: result.transactionHash,
          gasUsed: result.gasUsed,
          blockNumber: result.blockNumber
        });
      } else {
        res.status(400).json({
          message: 'Mint transaction failed',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Mint controller error:', error);
      res.status(500).json({
        message: 'Internal server error during mint operation'
      });
    }
  }

  /**
   * Get transaction status
   */
  static async getTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { txHash } = req.params;

      if (!txHash || txHash.length !== 66) {
        res.status(400).json({
          message: 'Invalid transaction hash'
        });
        return;
      }

      const result = await BlockchainService.getTransactionStatus(txHash);

      if (result.success) {
        res.status(200).json({
          status: result.status,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed
        });
      } else {
        res.status(400).json({
          message: 'Failed to get transaction status',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Transaction status controller error:', error);
      res.status(500).json({
        message: 'Internal server error while getting transaction status'
      });
    }
  }

  /**
   * Get wallet balance
   */
  static async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const result = await BlockchainService.getWalletBalance();

      if (result.success) {
        res.status(200).json({
          balance: result.balance,
          balanceInEther: result.balanceInEther,
          address: '0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F'
        });
      } else {
        res.status(400).json({
          message: 'Failed to get wallet balance',
          error: result.error
        });
      }

    } catch (error) {
      console.error('Wallet balance controller error:', error);
      res.status(500).json({
        message: 'Internal server error while getting wallet balance'
      });
    }
  }

  /**
   * Health check for blockchain service
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const balanceResult = await BlockchainService.getWalletBalance();
      
      res.status(200).json({
        message: 'Blockchain service is operational',
        walletConnected: balanceResult.success,
        walletAddress: '0xb3ef0999CF39cA4F8c8d800FCc4f979C16E4400F'
      });

    } catch (error) {
      console.error('Blockchain health check error:', error);
      res.status(500).json({
        message: 'Blockchain service health check failed'
      });
    }
  }
}

// Export validation middleware for use in routes
export const validateMintRequest = validateRequest(mintSchema);
export const validateTransactionStatusRequest = validateRequest(transactionStatusSchema);